import { inspectVideo } from "@/lib/engine";
import { handle, preflight } from "@/lib/http";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function POST(request: Request) {
  return handle(request, "inspect", async () => {
    const body = await request.json();
    return Response.json(await inspectVideo(body.url));
  });
}
