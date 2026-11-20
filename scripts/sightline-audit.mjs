// Runs the Sightline website audit (https://github.com/Zubair-hussain/Sightline)
// against every public Flux page and fails when SEO or link scores drop.
//
//   npm run audit                                  # Flux on http://127.0.0.1:3000
//   AUDIT_BASE_URL=https://your-domain npm run audit
//
// Reports: reports/sightline/<page>.html|json and reports/sightline/summary.md
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const cli = [
  process.env.SIGHTLINE_CLI,
  path.join(root, ".sightline/out/cli/sightline.js"),
  path.join(root, "../Project/out/cli/sightline.js"),
].find((file) => file && existsSync(file));
if (!cli) {
  console.error(
    "Sightline CLI not found. Clone and build it:\n" +
      "  git clone https://github.com/Zubair-hussain/Sightline .sightline\n" +
      "  cd .sightline && npm ci && npm run build\n" +
      "or set SIGHTLINE_CLI to out/cli/sightline.js.",
  );
  process.exit(2);
}

const base = (process.env.AUDIT_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const https = base.startsWith("https://");
const paths = (
  process.env.AUDIT_PATHS ||
  "/,/blog,/about,/privacy,/cookies,/terms,/copyright,/content-policy"
).split(",");
const minSeo = Number(process.env.AUDIT_MIN_SEO ?? 90);
const minLinks = Number(process.env.AUDIT_MIN_LINKS ?? 90);
// HTTPS/HSTS/HTTP3 checks only mean something on the real public host.
const minWebsite = Number(process.env.AUDIT_MIN_WEBSITE ?? (https ? 80 : 0));
const modules = process.env.AUDIT_MODULES || "seo,links,website,hreflang";
const out = path.join(root, "reports/sightline");
await mkdir(out, { recursive: true });

const rows = [];
const problems = [];
for (const page of paths) {
  const name =
    page === "/" ? "home" : page.replace(/^\//, "").replace(/\W+/g, "-");
  const json = path.join(out, `${name}.json`);
  try {
    await run(
      process.execPath,
      [
        cli,
        `${base}${page}`,
        "--modules",
        modules,
        "--pages",
        "10",
        "--json",
        json,
        "--html",
        path.join(out, `${name}.html`),
        "--quiet",
      ],
      { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 },
    );
  } catch (error) {
    if (!existsSync(json)) {
      problems.push(
        `${page}: audit did not run (${error.message.split("\n")[0]})`,
      );
      continue;
    }
  }
  const report = JSON.parse(await readFile(json, "utf8"));
  const score = (key) => report.categories[key]?.score ?? null;
  const findings = Object.values(report.categories)
    .flatMap((c) => c.checks)
    .filter((c) => c.status === "fail" || c.status === "warn")
    .map((c) => `${c.status === "fail" ? "✗" : "!"} ${c.title}: ${c.detail}`);
  rows.push({
    page,
    overall: report.score,
    seo: score("seo"),
    links: score("links"),
    website: score("website"),
    findings,
  });
  for (const [label, value, min] of [
    ["SEO", score("seo"), minSeo],
    ["Links", score("links"), minLinks],
    ["Website health", score("website"), minWebsite],
  ])
    if (value !== null && value < min)
      problems.push(`${page}: ${label} ${value} is below ${min}`);
}

const cell = (v) => (v === null ? "—" : String(v));
const summary = [
  `## Sightline audit — ${base}`,
  "",
  "| Page | Overall | SEO | Links | Website health |",
  "|---|---|---|---|---|",
  ...rows.map(
    (r) =>
      `| \`${r.page}\` | ${cell(r.overall)} | ${cell(r.seo)} | ${cell(r.links)} | ${cell(r.website)} |`,
  ),
  "",
  `Thresholds: SEO ≥ ${minSeo}, Links ≥ ${minLinks}, Website health ≥ ${minWebsite}.`,
  "",
  ...rows
    .filter((r) => r.findings.length)
    .flatMap((r) => [
      `<details><summary><code>${r.page}</code> — ${r.findings.length} finding(s)</summary>`,
      "",
      ...r.findings.map((f) => `- ${f}`),
      "",
      "</details>",
    ]),
  "",
  problems.length
    ? `### ❌ Failed\n\n${problems.map((p) => `- ${p}`).join("\n")}`
    : "### ✅ All pages meet the thresholds",
  "",
].join("\n");
await writeFile(path.join(out, "summary.md"), summary);
if (process.env.GITHUB_STEP_SUMMARY)
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);
process.exit(problems.length ? 1 : 0);
