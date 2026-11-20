import { adsConfig } from "@/lib/ads";
export const dynamic = "force-dynamic";
export function GET() {
  const { client } = adsConfig();
  return new Response(
    client
      ? `google.com, ${client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`
      : "# Google AdSense publisher is not configured.\n",
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
