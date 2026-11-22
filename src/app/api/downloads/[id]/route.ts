import { getJob, publicJob } from "@/lib/engine";
import { handle, preflight } from "@/lib/http";
import { isRouter, routeBackend } from "@/lib/backend-router";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, undefined, async () => {
    const { id } = await context.params;
    if (isRouter()) return routeBackend(request, `/api/downloads/${id}`, id);
    return Response.json(publicJob(await getJob(id)));
  });
}
