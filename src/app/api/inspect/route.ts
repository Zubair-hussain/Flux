import { inspectVideo } from "@/lib/engine";
import { handle, preflight } from "@/lib/http";
import { requireHuman } from "@/lib/turnstile";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function POST(request: Request) {
  return handle(request, "inspect", async () => {
    const body = await request.json();
    await requireHuman(request, body.turnstileToken);
    return Response.json(await inspectVideo(body.url));
  });
}
