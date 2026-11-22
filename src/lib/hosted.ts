// Hosted mode: Flux running on a public server (FLUX_HOSTED=true) instead of
// a user's own computer. Everything here is off unless that flag is set.
import { AppError } from "./policy";

export const isHosted = () =>
  process.env.FLUX_HOSTED === "true" || process.env.FLUX_ROUTER === "true";

/** Websites allowed to call the API from a browser, besides the server's own origin. */
export function allowedOrigins(env = process.env): string[] {
  return (env.FLUX_ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter((o) => /^https?:\/\/[^/\s]+$/.test(o));
}

export type RateKind = "inspect" | "download";

const windows: Record<
  RateKind,
  { limit: string; ms: number; fallback: number }
> = {
  inspect: { limit: "FLUX_RATE_INSPECT", ms: 10 * 60_000, fallback: 30 },
  download: { limit: "FLUX_RATE_DOWNLOAD", ms: 60 * 60_000, fallback: 8 },
};
const state = globalThis as typeof globalThis & {
  fluxRateHits?: Map<string, number[]>;
};
const hits = (state.fluxRateHits ??= new Map<string, number[]>());

/** Visitor address as reported by the proxy in front of the server. */
export function clientIp(request: Request) {
  const h = request.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("fly-client-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/** Sliding-window limit per visitor. Throws 429 when exceeded. */
export function enforceRateLimit(
  request: Request,
  kind: RateKind,
  now = Date.now(),
) {
  const rule = windows[kind];
  const limit = Number(process.env[rule.limit] ?? rule.fallback);
  if (!(limit > 0)) return;
  const key = `${kind}:${clientIp(request)}`;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < rule.ms);
  if (recent.length >= limit) {
    hits.set(key, recent);
    const minutes = Math.ceil((rule.ms - (now - recent[0])) / 60_000);
    throw new AppError(
      `Too many ${kind === "inspect" ? "lookups" : "downloads"} from your network. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or use the flux command on your own computer.`,
      429,
    );
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000)
    for (const [k, v] of hits)
      if (v.every((t) => now - t > 3_600_000)) hits.delete(k);
}

export const limits = () => ({
  maxDurationSeconds: Number(process.env.FLUX_MAX_DURATION || 7200),
  maxHeight: Number(process.env.FLUX_MAX_HEIGHT || 4320),
  maxFilesize: process.env.FLUX_MAX_FILESIZE || "4G",
  maxConcurrent: Math.max(1, Number(process.env.FLUX_MAX_CONCURRENT || 2)),
});
