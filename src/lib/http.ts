import { AppError } from "./policy";
export function guard(request: Request) {
  const host = new URL(request.url).hostname;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host))
    throw new AppError("Flux is a local-only service.", 403);
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== new URL(request.url).origin &&
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
