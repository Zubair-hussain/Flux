import { firebaseJob } from "./firebase";
import { AppError } from "./policy";
import { clientIp } from "./hosted";

export const isRouter = () => process.env.FLUX_ROUTER === "true";

type Backend = { url: string; fallback: boolean };

/**
 * FLUX_BACKENDS maps a backend ID to its HTTPS address, or to
 * { "url": "...", "fallback": true } for a server that should only be asked
 * after the others refuse (for example a home connection that platforms
 * trust more than a data centre).
 */
function backends(): Record<string, Backend> {
  try {
    const values = JSON.parse(process.env.FLUX_BACKENDS || "{}");
    if (
      !values ||
      Array.isArray(values) ||
      typeof values !== "object" ||
      !Object.keys(values).length
    )
      throw new Error();
    const parsed: Record<string, Backend> = {};
    for (const [id, value] of Object.entries(values)) {
      const detail =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as { url?: unknown; fallback?: unknown })
          : { url: value, fallback: false };
      if (typeof detail.url !== "string") throw new Error();
      const url = new URL(detail.url);
      if (
        !/^[a-zA-Z0-9_-]{1,64}$/.test(id) ||
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      )
        throw new Error();
      parsed[id] = { url: url.origin, fallback: detail.fallback === true };
    }
    if (!process.env.FLUX_ROUTER_SECRET) throw new Error();
    return parsed;
  } catch {
    throw new AppError("The download router is not configured.", 503);
  }
}

/** A backend's explicit "no" (blocked, busy, source refused): safe to ask the next one. */
function isRefusal(response: Response) {
  if (response.status === 422 || response.status === 429) return true;
  return (
    response.status === 503 &&
    (response.headers.get("content-type") || "").includes("application/json")
  );
}

/** On-demand selection only: no background keep-alive requests. */
export async function routeBackend(
  request: Request,
  apiPath: string,
  id?: string,
) {
  const configured = backends();
  let candidates: string[];
  if (id) {
    const record = await firebaseJob(id);
    if (!record) throw new AppError("Download not found.", 404);
    if (
      !Number.isFinite(record.expiresAt) ||
      typeof record.backendId !== "string"
    )
      throw new AppError("The download ownership record is invalid.", 503);
    if (record.expiresAt <= Date.now()) {
      await firebaseJob(id, "DELETE");
      throw new AppError(
        "This download has expired. Please download it again.",
        410,
      );
    }
    const owner = Object.hasOwn(configured, record.backendId)
      ? configured[record.backendId].url
      : "";
    if (!owner)
      throw new AppError("This download's server is unavailable.", 503);
    candidates = [owner];
  } else {
    const available = await Promise.all(
      Object.values(configured).map(async ({ url, fallback }) => {
        try {
          const response = await fetch(`${url}/api/health`, {
            headers: {
              "X-Flux-Router-Secret": process.env.FLUX_ROUTER_SECRET!,
            },
            redirect: "manual",
            cache: "no-store",
            signal: AbortSignal.timeout(5_000),
          });
          if (!response.ok) {
            console.warn("Flux backend health rejected", url, response.status);
            return null;
          }
          const health = await response.json();
          if (
            !Number.isInteger(health.active) ||
            !Number.isInteger(health.capacity) ||
            health.active < 0 ||
            health.capacity <= health.active
          ) {
            console.warn("Flux backend capacity unavailable", url, {
              active: health.active,
              capacity: health.capacity,
            });
            return null;
          }
          return {
            url,
            fallback,
            load: health.active / health.capacity,
            tie: Math.random(),
          };
        } catch (error) {
          console.warn(
            "Flux backend health request failed",
            url,
            error instanceof Error ? error.name : "UnknownError",
          );
          return null;
        }
      }),
    );
    // Primary servers first (least loaded first), fallback servers after them.
    candidates = available
      .filter((item) => item !== null)
      .sort(
        (a, b) =>
          Number(a.fallback) - Number(b.fallback) ||
          a.load - b.load ||
          a.tie - b.tie,
      )
      .map((item) => item.url);
    if (!candidates.length)
      throw new AppError(
        "Download servers are busy or starting up. Please retry shortly.",
        503,
      );
  }
  const body = request.method === "POST" ? await request.text() : undefined;
  // Only requests that start new work can move to another server; a file
  // belongs to the server that holds it.
  const canFailOver = !id && request.method === "POST";
  let firstRefusal: Response | undefined;
  for (let index = 0; index < candidates.length; index++) {
    let response: Response;
    try {
      response = await forward(request, candidates[index], apiPath, body);
    } catch (error) {
      // An earlier server gave a clear answer; that beats "could not be reached".
      if (firstRefusal) return firstRefusal;
      throw error;
    }
    const last = index === candidates.length - 1;
    if (!canFailOver || last || !isRefusal(response)) return response;
    // Keep the first explanation in case no server can do it.
    firstRefusal ??= new Response(await response.text(), {
      status: response.status,
      headers: response.headers,
    });
  }
  return firstRefusal!;
}

async function forward(
  request: Request,
  base: string,
  apiPath: string,
  body: string | undefined,
) {
  if (base === new URL(request.url).origin)
    throw new AppError(
      "The download router cannot forward requests to itself.",
      503,
    );
  const headers = new Headers({
    "X-Flux-Router-Secret": process.env.FLUX_ROUTER_SECRET!,
  });
  // Ignore client-supplied routing/auth headers. Only this server supplies these.
  headers.set("X-Forwarded-For", clientIp(request));
  headers.set("CF-Connecting-IP", clientIp(request));
  if (request.headers.has("content-type"))
    headers.set("Content-Type", request.headers.get("content-type")!);
  let response: Response;
  try {
    response = await fetch(`${base}${apiPath}`, {
      method: request.method,
      headers,
      ...(body !== undefined ? { body } : {}),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(
        apiPath.endsWith("/file") ? 30 * 60_000 : 90_000,
      ),
    });
  } catch {
    // Never replay a POST after an ambiguous failure: it may already have created a job.
    throw new AppError(
      "The download server could not be reached. Please retry shortly.",
      503,
    );
  }
  if (response.status >= 300 && response.status < 400)
    throw new AppError(
      "The download server returned an unexpected redirect.",
      503,
    );
  const outgoing = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  for (const name of [
    "content-type",
    "content-length",
    "content-disposition",
    "retry-after",
  ])
    if (response.headers.has(name))
      outgoing.set(name, response.headers.get(name)!);
  return new Response(response.body, {
    status: response.status,
    headers: outgoing,
  });
}
