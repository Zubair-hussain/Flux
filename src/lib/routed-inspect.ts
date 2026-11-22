import { routeBackend } from "./backend-router";
import { readCached, writeCached } from "./edge-cache";
import { AppError, validateUrl } from "./policy";

/** Good answers stay for five minutes; "no backend could fetch it" for one. */
export const inspectTtl = { found: 300, refused: 60 };

const tagged = (response: Response, state: "HIT" | "MISS") => {
  const copy = new Response(response.body, response);
  copy.headers.set("X-Flux-Cache", state);
  return copy;
};

/**
 * Website-router lookup: reject unsupported links here, answer repeats from the
 * edge cache, and only otherwise ask a backend (with failover).
 */
export async function routedInspect(request: Request) {
  const text = await request.text();
  let link: string;
  try {
    link = validateUrl(JSON.parse(text)?.url).url;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Enter a valid video URL.");
  }
  const hit = await readCached("inspect", link);
  if (hit) return tagged(hit, "HIT");
  const response = await routeBackend(request, "/api/inspect", undefined, text);
  // Capacity problems (429, 503) are never cached: they pass quickly.
  if (response.status === 200)
    await writeCached("inspect", link, response, inspectTtl.found);
  else if (response.status === 422)
    await writeCached("inspect", link, response, inspectTtl.refused);
  return tagged(response, "MISS");
}
