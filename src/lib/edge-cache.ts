// A small cache at the website router (Cloudflare's edge). Lookups of the same
// public video link are answered here instead of waking a download backend.
// It stores only public video details (title, creator, qualities), keyed by a
// hash of the normalised link, never anything about the visitor.
type EdgeCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

const keyOrigin = "https://flux-cache.invalid";

/** Cloudflare's per-location cache; absent in tests and on plain Node. */
function store(): EdgeCache | undefined {
  return (globalThis as { caches?: { default?: EdgeCache } }).caches?.default;
}

async function keyFor(kind: string, value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return new Request(`${keyOrigin}/${kind}/${hex}`);
}

export async function readCached(kind: string, value: string) {
  try {
    const cache = store();
    return cache ? await cache.match(await keyFor(kind, value)) : undefined;
  } catch {
    return undefined; // a cache problem must never break a lookup
  }
}

export async function writeCached(
  kind: string,
  value: string,
  response: Response,
  ttlSeconds: number,
) {
  try {
    const cache = store();
    if (!cache) return;
    await cache.put(
      await keyFor(kind, value),
      new Response(await response.clone().text(), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${ttlSeconds}`,
        },
      }),
    );
  } catch {
    /* caching is only an optimisation */
  }
}
