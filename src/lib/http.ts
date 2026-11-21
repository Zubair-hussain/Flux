import { AppError } from "./policy";
import {
  allowedOrigins,
  enforceRateLimit,
  isHosted,
  type RateKind,
} from "./hosted";
const loopback = ["localhost", "127.0.0.1", "[::1]"];
const port = (u: URL) => u.port || (u.protocol === "https:" ? "443" : "80");
const extensionOrigin = /^chrome-extension:\/\/[a-p]{32}$/;
// localhost, 127.0.0.1 and [::1] are the same local server: `next start`
// reports request.url as localhost even when the page was opened at 127.0.0.1.
function sameLocalServer(origin: string, target: URL) {
  try {
    const o = new URL(origin);
    return (
      o.protocol === target.protocol &&
      loopback.includes(o.hostname) &&
      port(o) === port(target)
    );
  } catch {
    return false;
  }
}
/** True when the browser origin may call this API. */
export function originAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const target = new URL(request.url);
  if (extensionOrigin.test(origin)) return true;
  if (isHosted())
    return (
      origin === target.origin ||
      origin === `${target.protocol}//${request.headers.get("host")}` ||
      allowedOrigins().includes(origin)
    );
  return sameLocalServer(origin, target);
}
export function guard(request: Request, kind?: RateKind) {
  const target = new URL(request.url);
  if (isHosted()) {
    if (!originAllowed(request))
      throw new AppError("Cross-origin request blocked.", 403);
    if (kind) enforceRateLimit(request, kind);
    return;
  }
  if (!loopback.includes(target.hostname))
    throw new AppError("Flux is a local-only service.", 403);
  if (!originAllowed(request))
    throw new AppError("Cross-origin request blocked.", 403);
}
export function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof AppError
          ? error.message
          : "An unexpected error occurred. Please retry.",
    },
    { status: error instanceof AppError ? error.status : 500 },
  );
}
function withCors(request: Request, response: Response) {
  const origin = request.headers.get("origin");
  if (isHosted() && origin && originAllowed(request)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}
/** Runs an API handler behind the local-only or hosted guard, with CORS in hosted mode. */
export async function handle(
  request: Request,
  kind: RateKind | undefined,
  run: () => Promise<Response> | Response,
) {
  try {
    guard(request, kind);
    return withCors(request, await run());
  } catch (error) {
    return withCors(request, failure(error));
  }
}
/** Answers browser preflight requests (hosted mode only). */
export function preflight(request: Request) {
  if (!isHosted() || !originAllowed(request))
    return new Response(null, { status: 403 });
  return withCors(
    request,
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    }),
  );
}
