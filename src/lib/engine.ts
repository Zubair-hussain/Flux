import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  readdir,
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
import { qualities, type Quality } from "./platforms";
import type { Job, VideoInfo } from "./types";
import { AsyncCache } from "./async-cache";

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
  const binary = process.env.YTDLP_PATH || process.env.PYTHON_PATH || "python";
  const prefix = process.env.YTDLP_PATH ? [] : ["-m", "yt_dlp"];
  try {
    const result = await exec(
      binary,
      [
        ...prefix,
        "--ignore-config",
        "--no-playlist",
        "--no-warnings",
        "--js-runtimes",
        `node:${process.execPath}`,
        "--socket-timeout",
        "20",
        "--retries",
        "2",
        ...args,
      ],
      { timeout, maxBuffer: 12 * 1024 * 1024, windowsHide: true },
    );
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
/** Short-edge resolution of a format, using the URL/note label (".../mp4-720p-...") when dimensions are missing. */
export function formatResolution(f: {
  width?: number;
  height?: number;
  url?: string;
  format_note?: string;
}): { value: number; inferred: boolean } {
  // Portrait videos use the short edge too: 720×1280 is a 720p source.
  if (f.width && f.height)
    return { value: Math.min(f.width, f.height), inferred: false };
  if (f.height) return { value: f.height, inferred: false };
  const label = `${f.format_note || ""} ${f.url || ""}`.match(
    /(?:^|[^a-z0-9])(\d{3,4})p(?:[^a-z0-9]|$)/i,
  );
  return { value: label ? Number(label[1]) : 0, inferred: Boolean(label) };
}
async function extractVideo(
  url: string,
  platform: string,
): Promise<Inspection> {
  const info = JSON.parse(
    await run(["--dump-single-json", "--skip-download", "--", url]),
  );
  enforceContentPolicy(info);
  const formats = (
    info.formats as {
      format_id?: string;
      width?: number;
      height?: number;
      vcodec?: string;
      has_drm?: boolean;
      url?: string;
      format_note?: string;
    }[]
  ).filter((f) => f.vcodec !== "none" && !f.has_drm);
  const resolutions = new Set<number>();
  const formatIds: Partial<Record<Quality, string>> = {};
  for (const f of formats) {
    const { value, inferred } = formatResolution(f);
    resolutions.add(value);
    if (
      inferred &&
      f.format_id &&
      /^[\w.-]+$/.test(f.format_id) &&
      qualities.includes(value as Quality)
    )
      formatIds[value as Quality] = f.format_id;
  }
  const available = qualities.filter((q) => resolutions.has(q));
  if (!available.length)
    throw new AppError(
      "No supported video resolution was found (720p–8K).",
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
  // Reserve a slot before metadata extraction to bound concurrent subprocesses.
  if (active.size >= 2)
    throw new AppError(
      "Two downloads are already running. Try again when one finishes.",
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
    await run(
      [
        "--concurrent-fragments",
        "4",
        "--max-filesize",
        "4G",
        "--match-filter",
        "!is_live & age_limit<?18",
        "--format",
        `bv[height=${job.quality}][width>=?${job.quality}]+ba/b[height=${job.quality}][width>=?${job.quality}]/bv[width=${job.quality}][height>${job.quality}]+ba/b[width=${job.quality}][height>${job.quality}]${labelledFormat ? `/${labelledFormat}` : ""}`,
        "--merge-output-format",
        "mkv",
        "--output",
        path.join(folder, "video.%(ext)s"),
        "--",
        url,
      ],
      30 * 60 * 1000,
    );
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
