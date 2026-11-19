import { performance } from "node:perf_hooks";

const base = process.argv[2] || "http://127.0.0.1:3000";
const samples = [];
for (const label of [
  "homepage",
  "downloads",
  "inspection-cold",
  "inspection-repeat-1",
  "inspection-repeat-2",
]) {
  const inspect = label.startsWith("inspection");
  const route = inspect
    ? "/api/inspect"
    : label === "downloads"
      ? "/api/downloads"
      : "/";
  const start = performance.now();
  const response = await fetch(
    new URL(route, base),
    inspect
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
          }),
          signal: AbortSignal.timeout(90000),
        }
      : { signal: AbortSignal.timeout(90000) },
  );
  await response.text();
  samples.push({
    label,
    status: response.status,
    milliseconds: Math.round(performance.now() - start),
  });
}
console.log(
  JSON.stringify(
    { checkedAt: new Date().toISOString(), base, samples },
    null,
    2,
  ),
);
