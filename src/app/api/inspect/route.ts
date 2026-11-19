import { inspectVideo } from "@/lib/engine";
import { failure, guard } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    guard(request);
    const body = await request.json();
    return Response.json(await inspectVideo(body.url));
  } catch (error) {
    return failure(error);
  }
}
