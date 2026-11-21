import { createJob, listJobs } from "@/lib/engine";
import { isHosted } from "@/lib/hosted";
import { handle, preflight } from "@/lib/http";
import { requireHuman } from "@/lib/turnstile";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function GET(request: Request) {
  // A public server must never list other visitors' downloads.
  return handle(request, undefined, async () =>
    Response.json(isHosted() ? [] : await listJobs()),
  );
}
export async function POST(request: Request) {
  return handle(request, "download", async () => {
    const body = await request.json();
    await requireHuman(request, body.turnstileToken);
    return Response.json(await createJob(body.url, body.quality), {
      status: 202,
    });
  });
}
