// yt-dlp rules shared by the web app (engine.ts) and the `flux` CLI, so both
// enforce the same safety limits and quality selection.
import { qualities, type Quality } from "./platforms";
import { AppError } from "./policy";

export const safeModuleLauncher =
  "import sys,runpy;sys.path[:]=[p for p in sys.path if p not in ('','.')];runpy.run_module('yt_dlp',run_name='__main__',alter_sys=True)";

/** Executable and fixed safety flags; per-call arguments are appended. */
export function ytdlpCommand(
  args: string[],
  env: Record<string, string | undefined> = process.env,
) {
  const binary = env.YTDLP_PATH || env.PYTHON_PATH || "python";
  // `python -m` puts the current folder first on the import path, so a stray
  // yt_dlp.py in the folder Flux runs from would execute as the downloader.
  // Drop the current folder before importing (works on every Python version,
  // unlike -P/PYTHONSAFEPATH which need 3.11+).
  const prefix = env.YTDLP_PATH ? [] : ["-c", safeModuleLauncher];
  return {
    binary,
    args: [
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
  };
}

/** Download flags: no live streams, no age-restricted media, 4 GB cap. */
export const downloadSafetyArgs = [
  "--concurrent-fragments",
  "4",
  "--max-filesize",
  "4G",
  "--match-filter",
  "!is_live & age_limit<?18",
];

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

type Format = {
  format_id?: string;
  width?: number;
  height?: number;
  vcodec?: string;
  has_drm?: boolean;
  url?: string;
  format_note?: string;
};

/** Source qualities (720p–8K) excluding DRM and audio-only formats. */
export function sourceQualities(formats: Format[]) {
  const resolutions = new Set<number>();
  const formatIds: Partial<Record<Quality, string>> = {};
  for (const f of formats.filter((f) => f.vcodec !== "none" && !f.has_drm)) {
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
  return { qualities: available, formatIds };
}

/** Exact-resolution selector; never falls back to a different quality. */
export function formatSelector(quality: Quality, labelledFormat?: string) {
  const q = quality;
  return `bv[height=${q}][width>=?${q}]+ba/b[height=${q}][width>=?${q}]/bv[width=${q}][height>${q}]+ba/b[width=${q}][height>${q}]${labelledFormat ? `/${labelledFormat}` : ""}`;
}
