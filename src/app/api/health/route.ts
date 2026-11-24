import { timingSafeEqual } from "node:crypto";
import { backendCapacity } from "@/lib/engine";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ytdlpCommand } from "@/lib/ytdlp";

const diagnosticTargets: Record<string, string> = {
  youtube: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  dailymotion: "https://www.dailymotion.com/video/xbxi4vu",
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.FLUX_ROUTER_SECRET;
  const supplied = request.headers.get("x-flux-router-secret") || "";
  const authorized =
    process.env.FLUX_HOSTED === "true" &&
    process.env.FLUX_ROUTER !== "true" &&
    secret &&
    Buffer.byteLength(secret) === Buffer.byteLength(supplied) &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(supplied));
  const diagnostic = new URL(request.url).searchParams.get("diagnostic");
  if (
    authorized &&
    diagnostic &&
    Object.hasOwn(diagnosticTargets, diagnostic)
  ) {
    // Operator-only, fixed public test videos. Never accept URLs or free-form arguments.
    const command = ytdlpCommand([
      "--skip-download",
      "--dump-single-json",
      "--",
      diagnosticTargets[diagnostic],
    ]);
    try {
      const result = await promisify(execFile)(command.binary, command.args, {
        timeout: 60_000,
        maxBuffer: 12 * 1024 * 1024,
        windowsHide: true,
      });
      const info = JSON.parse(result.stdout);
      return Response.json(
        {
          ok: true,
          revision: process.env.RENDER_GIT_COMMIT,
          target: diagnostic,
          title: info.title,
          formats: info.formats?.length,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      const detail = error as {
        code?: string | number;
        signal?: string;
        stderr?: string;
      };
      return Response.json(
        {
          ok: false,
          revision: process.env.RENDER_GIT_COMMIT,
          target: diagnostic,
          code: detail.code,
          signal: detail.signal,
          stderr: String(detail.stderr || "").slice(-1500),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  return Response.json(
    authorized
      ? {
          ok: true,
          ...backendCapacity(),
          revision: process.env.RENDER_GIT_COMMIT,
        }
      : { ok: true },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
