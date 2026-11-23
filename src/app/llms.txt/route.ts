import { bloggerPosts } from "@/lib/blogger";
import { buildLlmsTxt } from "@/lib/llms";
// Built on every request so new Blogger posts appear without a redeploy.
export const dynamic = "force-dynamic";
export async function GET() {
  return new Response(buildLlmsTxt(await bloggerPosts()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
