// Worker entry for Cloudflare (wrangler.jsonc "main"). It is the OpenNext worker
// plus a timer that keeps one free download server awake.
//
// Free Render servers go to sleep after 15 quiet minutes and take about 30
// seconds to wake, which shows visitors "servers busy". A health request every
// ten minutes keeps the first server warm. Only the first one is kept awake:
// Render's free plan gives 750 running hours a month per account, enough for
// one server all month but not two. The other wakes on demand when needed.
import worker from "./.open-next/worker.js";

export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

function firstBackend(env) {
  try {
    const values = JSON.parse(env.FLUX_BACKENDS || "{}");
    for (const value of Object.values(values)) {
      const detail = typeof value === "string" ? { url: value } : value;
      if (detail && !detail.fallback && typeof detail.url === "string")
        return new URL(detail.url).origin;
    }
  } catch {
    // Nothing configured: nothing to keep warm.
  }
  return null;
}

export default {
  fetch: worker.fetch.bind(worker),
  async scheduled(_event, env, ctx) {
    const url = firstBackend(env);
    if (!url || !env.FLUX_ROUTER_SECRET) return;
    ctx.waitUntil(
      fetch(`${url}/api/health`, {
        headers: { "X-Flux-Router-Secret": env.FLUX_ROUTER_SECRET },
        redirect: "manual",
        signal: AbortSignal.timeout(90_000),
      }).catch(() => {}),
    );
  },
};
