// yt-dlp rules shared by the web app (engine.ts) and the `flux` CLI, so both
// enforce the same safety limits and quality selection.
import { platforms, qualities, type Quality } from "./platforms";
import { AppError } from "./policy";

/** Recognize source failures without exposing stderr, URLs, or server paths. */
export function sourceAccessError(stderr: string) {
  if (
    /\[youtube\]/i.test(stderr) &&
    /confirm you(?:'|’|&#39;|&apos;)?re not a bot|confirm you are not a bot/i.test(
      stderr,
    )
  )
    return new AppError(
      "YouTube is refusing requests from this server and requires a sign-in check. Try the Flux command on your own computer. Retrying another quality will not fix this server restriction.",
      422,
      "cli",
    );
  if (/HTTP Error 429|Too Many Requests/i.test(stderr))
    return new AppError(
      "The video platform has temporarily rate-limited this server. Please try again later or use Flux on your own computer.",
      429,
      "cli",
    );
  if (
    /\[youtube\]/i.test(stderr) &&
    /No supported JavaScript runtime|challenge solving failed|n challenge solving failed|Signature extraction failed|yt-dlp-ejs.*(?:missing|not installed)/i.test(
      stderr,
    )
  )
    return new AppError(
      "The server's YouTube extractor needs an update or a working JavaScript challenge solver. Please try again after the server is updated.",
      503,
      "cli",
    );
  return new AppError(
    "The source could not be accessed. It may require sign-in, restrict downloads, or be temporarily unavailable.",
    422,
    "cli",
  );
}

const proxySchemes = ["http:", "https:", "socks4:", "socks5:", "socks5h:"];
/**
 * Optional proxy for platforms that refuse data-centre addresses.
 * FLUX_PROXY_URL is the proxy (for example a residential one) and
 * FLUX_PROXY_PLATFORMS lists the platform IDs that use it ("youtube,dailymotion",
 * or "all"). Without that list nothing is proxied, so bandwidth costs stay
 * under control. The address is never logged or shown to visitors.
 */
export function proxyArgs(
  platform: string | undefined,
  env: Record<string, string | undefined> = process.env,
): string[] {
  const raw = env.FLUX_PROXY_URL || "";
  if (!raw || /\s/.test(raw) || raw.startsWith("-") || !platform) return [];
  try {
    if (!proxySchemes.includes(new URL(raw).protocol)) return [];
  } catch {
    return [];
  }
  const wanted = (env.FLUX_PROXY_PLATFORMS || "")
    .toLowerCase()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const entry = platforms.find((p) => p.name === platform);
  const used =
    wanted.includes("all") ||
    (entry &&
      (wanted.includes(entry.id) || wanted.includes(entry.name.toLowerCase())));
  return used ? ["--proxy", raw] : [];
}

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

/** Download flags: no live streams, no age-restricted media, size cap (4 GB; FLUX_MAX_FILESIZE on a public server). */
export const downloadSafetyArgs = [
  "--concurrent-fragments",
  "4",
  "--max-filesize",
  /^\d+(\.\d+)?[KMG]$/i.test(process.env.FLUX_MAX_FILESIZE || "")
    ? process.env.FLUX_MAX_FILESIZE!
    : "4G",
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

/**
 * Exact-resolution selector; never falls back to a different quality.
 * `directFirst` tries single-file formats before separate video+audio streams.
 * Some sources (X) offer both, and the streamed pieces can fail to download
 * while the direct file works, so a failed first attempt is retried this way.
 */
export function formatSelector(
  quality: Quality,
  labelledFormat?: string,
  directFirst = false,
) {
  const q = quality;
  const merged = `bv[height=${q}][width>=?${q}]+ba`;
  const single = `b[height=${q}][width>=?${q}]`;
  const merged2 = `bv[width=${q}][height>${q}]+ba`;
  const single2 = `b[width=${q}][height>${q}]`;
  const order = directFirst
    ? [single, merged, single2, merged2]
    : [merged, single, merged2, single2];
  return `${order.join("/")}${labelledFormat ? `/${labelledFormat}` : ""}`;
}

/** Output name that stays inside Windows' path limit even for long, hashtag-filled titles. */
export const outputTemplate = "%(title).60B [%(id)s].%(ext)s";
