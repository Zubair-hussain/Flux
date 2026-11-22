import { firebaseJob } from "./firebase";
import { AppError } from "./policy";
import { clientIp } from "./hosted";

export const isRouter = () => process.env.FLUX_ROUTER === "true";

function backends(): Record<string, string> {
  try {
    const values = JSON.parse(process.env.FLUX_BACKENDS || "{}");
    if (
      !values ||
      Array.isArray(values) ||
      typeof values !== "object" ||
      !Object.keys(values).length
    )
      throw new Error();
    for (const [id, value] of Object.entries(values)) {
      const url = new URL(String(value));
      if (
        !/^[a-zA-Z0-9_-]{1,64}$/.test(id) ||
        typeof value !== "string" ||
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      )
        throw new Error();
      values[id] = url.origin;
    }
    if (!process.env.FLUX_ROUTER_SECRET) throw new Error();
    return values;
  } catch {
    throw new AppError("The download router is not configured.", 503);
  }
}

/** On-demand selection only: no background keep-alive requests. */
export async function routeBackend(
  request: Request,
  apiPath: string,
  id?: string,
) {
  const configured = backends();
  let base: string;
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
    base = Object.hasOwn(configured, record.backendId)
      ? configured[record.backendId]
      : "";
    if (!base)
      throw new AppError("This download's server is unavailable.", 503);
  } else {
    const available = await Promise.all(
      Object.values(configured).map(async (url) => {
        try {
          const response = await fetch(`${url}/api/health`, {
            headers: {
              "X-Flux-Router-Secret": process.env.FLUX_ROUTER_SECRET!,
            },
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.timeout(5_000),
          });
          if (!response.ok) return null;
          const health = await response.json();
          if (
            !Number.isInteger(health.active) ||
            !Number.isInteger(health.capacity) ||
            health.active < 0 ||
            health.capacity <= health.active
          )
            return null;
          return {
            url,
            load: health.active / health.capacity,
            tie: Math.random(),
          };
        } catch {
          return null;
        }
      }),
    );
    const chosen = available
      .filter((item) => item !== null)
      .sort((a, b) => a.load - b.load || a.tie - b.tie)[0];
    if (!chosen)
      throw new AppError(
        "Download servers are busy or starting up. Please retry shortly.",
        503,
      );
    base = chosen.url;
  }
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
      ...(request.method === "POST" ? { body: await request.text() } : {}),
      redirect: "error",
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
