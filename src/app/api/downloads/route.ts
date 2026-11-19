import { createJob, listJobs } from "@/lib/engine";
import { failure, guard } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    guard(request);
    return Response.json(await listJobs());
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    guard(request);
    const body = await request.json();
    return Response.json(await createJob(body.url, body.quality), {
      status: 202,
    });
  } catch (error) {
    return failure(error);
  }
}
