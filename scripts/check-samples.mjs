import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Metadata-only integration check. Start Flux with npm run dev first.
// These public URLs are test candidates, not a guarantee of permission to download.
const samples = JSON.parse(
  await readFile(new URL("../docs/SAMPLE-URLS.json", import.meta.url), "utf8"),
);
const results = [];
for (let i = 0; i < samples.length; i += 3) {
  const batch = await Promise.all(
    samples.slice(i, i + 3).map(async (sample) => {
      const checkedAt = new Date().toISOString();
      try {
        const response = await fetch("http://127.0.0.1:3000/api/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: sample.url }),
          signal: AbortSignal.timeout(75000),
        });
        const data = await response.json();
        return {
          ...sample,
          checkedAt,
          status: response.ok ? "inspection passed" : "inspection failed",
          httpStatus: response.status,
          ...(response.ok
            ? { title: data.title, qualities: data.qualities }
            : { error: data.error }),
        };
      } catch (error) {
        return {
          ...sample,
          checkedAt,
          status: "request failed",
          error: error.message,
        };
      }
    }),
  );
  results.push(...batch);
  for (const result of batch) console.log(JSON.stringify(result));
}
const output = new URL("../docs/LIVE-SAMPLE-RESULTS.json", import.meta.url);
await writeFile(
  output,
  JSON.stringify(
    {
      checkedFrom:
        "Local Flux API; metadata inspection only, no media download",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Saved results: ${fileURLToPath(output)}`);
