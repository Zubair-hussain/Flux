import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { downloadFile } from "@/lib/engine";
import { handle } from "@/lib/http";
import { isRouter, routeBackend } from "@/lib/backend-router";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, undefined, async () => {
    const { id } = await context.params;
    if (isRouter())
      return routeBackend(request, `/api/downloads/${id}/file`, id);
    const { file, size, name } = await downloadFile(id);
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
  });
}
