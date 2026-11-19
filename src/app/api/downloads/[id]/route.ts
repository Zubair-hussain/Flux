import { getJob, publicJob } from "@/lib/engine";
import { failure, guard } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    guard(request);
    return Response.json(publicJob(await getJob((await context.params).id)));
  } catch (error) {
    return failure(error);
  }
}
