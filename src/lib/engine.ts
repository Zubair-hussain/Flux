import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  AppError,
  enforceContentPolicy,
  validateQuality,
  validateUrl,
} from "./policy";
import { qualityLabel, type Quality } from "./platforms";
import type { Job, VideoInfo } from "./types";
import { AsyncCache } from "./async-cache";
import { limits } from "./hosted";
import {
  downloadSafetyArgs,
  formatSelector,
  sourceQualities,
  ytdlpCommand,
} from "./ytdlp";
export { formatResolution } from "./ytdlp";

const exec = promisify(execFile);
const root = path.join(process.cwd(), "downloads");
const state = globalThis as typeof globalThis & {
  fluxActive?: Set<string>;
  fluxInspectionCache?: AsyncCache<Inspection>;
  fluxJobListCache?: AsyncCache<ReturnType<typeof publicJob>[]>;
};
const active = (state.fluxActive ??= new Set<string>());
// Internal inspection result: public video info plus format IDs for sources
// (e.g. LinkedIn) whose resolution is only known from the media URL.
type Inspection = VideoInfo & { formatIds?: Partial<Record<Quality, string>> };
const inspections = (state.fluxInspectionCache ??= new AsyncCache<Inspection>(
  60_000,
  100,
));
const jobLists = (state.fluxJobListCache ??= new AsyncCache<
  ReturnType<typeof publicJob>[]
>(2_000, 1));
async function run(args: string[], timeout = 60000) {
  const command = ytdlpCommand(args);
  try {
    const result = await exec(command.binary, command.args, {
      timeout,
      maxBuffer: 12 * 1024 * 1024,
      windowsHide: true,
    });
    return result.stdout;
  } catch (error) {
    const e = error as { code?: string; stderr?: string };
    if (e.code === "ENOENT" || e.stderr?.includes("No module named yt_dlp"))
      throw new AppError(
        'Download engine missing. Run: python -m pip install -U "yt-dlp[default,curl-cffi]"',
        503,
      );
    if (e.stderr?.includes("ffmpeg"))
      throw new AppError(
        "FFmpeg is required to merge high-quality video and audio. Install FFmpeg and restart Flux.",
        503,
      );
    throw new AppError(
      "The source could not be accessed. It may require sign-in, restrict downloads, or be temporarily unavailable.",
      422,
    );
  }
}
async function inspect(input: unknown): Promise<Inspection> {
  const { url, platform } = validateUrl(input);
  // Every caller still passes URL policy checks, including on a cache hit.
  return inspections.get(url, () => extractVideo(url, platform));
}
export async function inspectVideo(input: unknown): Promise<VideoInfo> {
  const { formatIds: _formatIds, ...info } = await inspect(input);
  return info;
}
async function extractVideo(
  url: string,
  platform: string,
): Promise<Inspection> {
  const info = JSON.parse(
    await run(["--dump-single-json", "--skip-download", "--", url]),
  );
  enforceContentPolicy(info);
  const found = sourceQualities(
    Array.isArray(info.formats) ? info.formats : [],
  );
  const formatIds = found.formatIds;
  const maxHeight = limits().maxHeight;
  const available = found.qualities.filter((q) => q <= maxHeight);
  if (!available.length)
    throw new AppError(
      `This server offers up to ${qualityLabel(maxHeight)}, but this video starts higher. Use the flux command on your own computer.`,
      422,
    );
  let thumbnail: string | undefined;
  try {
    const u = new URL(info.thumbnail);
    if (u.protocol === "https:") thumbnail = u.href;
  } catch {
    /* optional */
  }
  return {
    url,
    platform,
    title: String(info.title).slice(0, 300),
    creator: String(info.uploader || info.channel || platform).slice(0, 100),
    duration: Number(info.duration) || 0,
    thumbnail,
    qualities: available,
    ...(Object.keys(formatIds).length ? { formatIds } : {}),
  };
}
const jobPath = (id: string) => path.join(root, `${id}.json`);
async function save(job: Job) {
  await mkdir(root, { recursive: true });
  const temp = `${jobPath(job.id)}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(job), "utf8");
  await rename(temp, jobPath(job.id));
  jobLists.clear();
}
export async function getJob(id: string): Promise<Job> {
  if (!/^[a-f0-9-]{36}$/.test(id))
    throw new AppError("Download not found.", 404);
  let job: Job;
  try {
    job = JSON.parse(await readFile(jobPath(id), "utf8"));
  } catch {
    throw new AppError("Download not found.", 404);
  }
  if (["queued", "downloading"].includes(job.status) && !active.has(id)) {
    job.status = "failed";
    job.error = "The server restarted. Please retry this download.";
    await save(job);
  }
  return job;
}
let lastPrune = 0;
/** Retention in milliseconds: FLUX_RETENTION_HOURS, else FLUX_RETENTION_DAYS (default 7 days; 0 keeps everything). */
function retentionMs() {
  const hours = process.env.FLUX_RETENTION_HOURS;
  return hours !== undefined && hours !== ""
    ? Number(hours) * 3_600_000
    : Number(process.env.FLUX_RETENTION_DAYS ?? 7) * 86_400_000;
}
/** Deletes finished downloads older than the retention period. */
export async function pruneOldJobs(now = Date.now()) {
  const keep = retentionMs();
  if (!(keep > 0)) return 0;
  const cutoff = now - keep;
  let names: string[];
  try {
    names = await readdir(root);
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of names.filter((n) => /^[a-f0-9-]{36}\.json$/.test(n))) {
    const id = name.slice(0, -5);
    if (active.has(id)) continue;
    try {
      const job = JSON.parse(await readFile(jobPath(id), "utf8")) as Job;
      if (!(Date.parse(job.createdAt) < cutoff)) continue;
      await rm(path.join(root, id), { recursive: true, force: true });
      await rm(jobPath(id), { force: true });
      removed++;
    } catch {
      /* unreadable records are left for manual cleanup */
    }
  }
  if (removed) jobLists.clear();
  return removed;
}
export async function listJobs() {
  return jobLists.get("recent", readRecentJobs);
}
async function readRecentJobs() {
  await mkdir(root, { recursive: true });
  const names = (await readdir(root)).filter((n) =>
    /^[a-f0-9-]{36}\.json$/.test(n),
  );
  return (await Promise.all(names.map((n) => getJob(n.slice(0, -5)))))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50)
    .map(publicJob);
}
export function publicJob(job: Job) {
  const { file: _file, ...rest } = job;
  return rest;
}
export async function createJob(input: unknown, requestedQuality: unknown) {
  const quality = validateQuality(requestedQuality);
  const keep = retentionMs();
  if (keep > 0 && Date.now() - lastPrune > Math.min(3_600_000, keep / 2)) {
    lastPrune = Date.now();
    void pruneOldJobs().catch(() => {});
  }
  // Reserve a slot before metadata extraction to bound concurrent subprocesses.
  const { maxConcurrent } = limits();
  if (active.size >= maxConcurrent)
    throw new AppError(
      maxConcurrent === 2
        ? "Two downloads are already running. Try again when one finishes."
        : `${maxConcurrent} downloads are already running. Try again in a minute.`,
      429,
    );
  const id = randomUUID();
  active.add(id);
  try {
    const info = await inspect(input);
    if (!info.qualities.includes(quality))
      throw new AppError("This source does not offer the selected resolution.");
    const job: Job = {
      id,
      title: info.title,
      platform: info.platform,
      quality,
      status: "queued",
      createdAt: new Date().toISOString(),
    };
    await save(job);
    void processJob(job, info.url, info.formatIds?.[quality])
      .catch(() => {
        /* storage failures cannot be written back; restart detection handles interrupted records */
      })
      .finally(() => active.delete(id));
    return publicJob(job);
  } catch (error) {
    active.delete(id);
    throw error;
  }
}
async function processJob(job: Job, url: string, labelledFormat?: string) {
  try {
    job.status = "downloading";
    await save(job);
    const folder = path.join(root, job.id);
    await mkdir(folder, { recursive: true });
    const download = (directFirst: boolean) =>
      run(
        [
          ...downloadSafetyArgs,
          "--format",
          formatSelector(job.quality, labelledFormat, directFirst),
          "--merge-output-format",
          "mkv",
          "--output",
          path.join(folder, "video.%(ext)s"),
          "--",
          url,
        ],
        30 * 60 * 1000,
      );
    try {
      await download(false);
    } catch (error) {
      // Streamed pieces can fail where the single file works (seen on X).
      if (error instanceof AppError && error.status === 503) throw error;
      await download(true);
    }
    const files = (await readdir(folder)).filter((f) =>
      /^video\.(mp4|mkv|webm|mov)$/.test(f),
    );
    if (files.length !== 1)
      throw new Error("The download did not produce a complete file.");
    job.file = path.join(folder, files[0]);
    job.status = "complete";
    await save(job);
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Download failed.";
    await save(job);
  }
}
export async function downloadFile(id: string) {
  const job = await getJob(id);
  if (job.status !== "complete" || !job.file)
    throw new AppError("The file is not ready.", 409);
  const file = path.resolve(job.file);
  if (!file.startsWith(path.resolve(root, id) + path.sep))
    throw new AppError("Invalid file path.", 403);
  return {
    file,
    size: (await stat(file)).size,
    name: `flux-${id.slice(0, 8)}${path.extname(file)}`,
  };
}
