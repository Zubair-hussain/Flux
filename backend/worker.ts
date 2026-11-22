// Flux download backend on Cloudflare: a Worker in front of a container that
// runs the Flux server (Node, Python, yt-dlp, FFmpeg) from ../Dockerfile.
// The website router calls this Worker like any other backend. Deploy with
// `npm run cf:backend:deploy`; settings and secrets are in docs/CLOUDFLARE-BACKEND.md.
import { Container, getContainer } from "@cloudflare/containers";

type Env = {
  FLUX_CONTAINER: DurableObjectNamespace<FluxContainer>;
  FLUX_BACKEND_ID?: string;
  FLUX_ROUTER_SECRET?: string;
  FIREBASE_DATABASE_URL?: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  TURNSTILE_SECRET_KEY?: string;
  FLUX_PROXY_URL?: string;
  FLUX_PROXY_PLATFORMS?: string;
  FLUX_MAX_HEIGHT?: string;
  FLUX_MAX_DURATION?: string;
  FLUX_MAX_FILESIZE?: string;
  FLUX_MAX_CONCURRENT?: string;
  FLUX_RETENTION_HOURS?: string;
  FLUX_RATE_INSPECT?: string;
  FLUX_RATE_DOWNLOAD?: string;
};

/** Settings handed to the container when it starts (secrets included). */
const passedToContainer = [
  "FLUX_BACKEND_ID",
  "FLUX_ROUTER_SECRET",
  "FIREBASE_DATABASE_URL",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "TURNSTILE_SECRET_KEY",
  "FLUX_PROXY_URL",
  "FLUX_PROXY_PLATFORMS",
  "FLUX_MAX_HEIGHT",
  "FLUX_MAX_DURATION",
  "FLUX_MAX_FILESIZE",
  "FLUX_MAX_CONCURRENT",
  "FLUX_RETENTION_HOURS",
  "FLUX_RATE_INSPECT",
  "FLUX_RATE_DOWNLOAD",
] as const;

export class FluxContainer extends Container<Env> {
  defaultPort = 3000;
  // Stop paying for an idle container; the next request wakes it again.
  sleepAfter = "15m";
  enableInternet = true;

  constructor(ctx: ConstructorParameters<typeof Container>[0], env: Env) {
    super(ctx, env);
    const vars: Record<string, string> = {
      FLUX_HOSTED: "true",
      NODE_ENV: "production",
      PYTHON_PATH: "python3",
    };
    for (const name of passedToContainer) {
      const value = env[name];
      if (typeof value === "string" && value) vars[name] = value;
    }
    this.envVars = vars;
  }
}

const json = (error: string, status: number) =>
  Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );

/** Constant-time comparison so the secret cannot be guessed byte by byte. */
function sameSecret(expected: string, supplied: string) {
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(supplied);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export default {
  async fetch(request: Request, env: Env) {
    // Fail closed: without the shared secret this backend serves nobody.
    if (!env.FLUX_ROUTER_SECRET)
      return json("This download server is not configured yet.", 503);
    const supplied = request.headers.get("x-flux-router-secret") || "";
    if (!sameSecret(env.FLUX_ROUTER_SECRET, supplied))
      return json("Access this download server through the website.", 403);
    return getContainer(
      env.FLUX_CONTAINER,
      env.FLUX_BACKEND_ID || "cf-1",
    ).fetch(request);
  },
};
