import { AppError } from "./policy";
const loopback = ["localhost", "127.0.0.1", "[::1]"];
const port = (u: URL) => u.port || (u.protocol === "https:" ? "443" : "80");
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
export function guard(request: Request) {
  const target = new URL(request.url);
  if (!loopback.includes(target.hostname))
    throw new AppError("Flux is a local-only service.", 403);
  const origin = request.headers.get("origin");
  if (
    origin &&
    !sameLocalServer(origin, target) &&
    !/^chrome-extension:\/\/[a-p]{32}$/.test(origin)
  )
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
