import { inspectVideo } from "@/lib/engine";
import { handle, preflight } from "@/lib/http";
import { requireHuman } from "@/lib/turnstile";
import { isRouter } from "@/lib/backend-router";
import { routedInspect } from "@/lib/routed-inspect";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function POST(request: Request) {
  return handle(request, "inspect", async () => {
    if (isRouter()) return routedInspect(request);
    const body = await request.json();
    await requireHuman(request, body.turnstileToken);
    return Response.json(await inspectVideo(body.url));
  });
}
