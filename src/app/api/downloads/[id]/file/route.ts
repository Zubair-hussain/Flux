import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { downloadFile } from "@/lib/engine";
import { failure, guard } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    guard(request);
    const { file, size, name } = await downloadFile((await context.params).id);
    return new Response(
      Readable.toWeb(createReadStream(file)) as ReadableStream,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${name}"`,
          "Content-Length": String(size),
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return failure(error);
  }
}
