import { getJob, publicJob } from "@/lib/engine";
import { handle, preflight } from "@/lib/http";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, undefined, async () =>
    Response.json(publicJob(await getJob((await context.params).id))),
  );
}
