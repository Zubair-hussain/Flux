import { timingSafeEqual } from "node:crypto";
import { backendCapacity } from "@/lib/engine";
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
  return Response.json(
    authorized ? { ok: true, ...backendCapacity() } : { ok: true },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
