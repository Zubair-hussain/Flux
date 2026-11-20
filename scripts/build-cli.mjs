// Bundles the `flux` CLI into one dependency-free file: packages/cli/dist/flux.mjs
import { build } from "esbuild";
import { copyFile, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkgDir = path.join(root, "packages/cli");
const { version } = JSON.parse(
  await readFile(path.join(pkgDir, "package.json"), "utf8"),
);
await build({
  entryPoints: [path.join(root, "src/cli/bin.ts")],
  outfile: path.join(pkgDir, "dist/flux.mjs"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  minify: false,
  legalComments: "none",
  banner: { js: "#!/usr/bin/env node" },
  define: { __FLUX_VERSION__: JSON.stringify(version) },
  logLevel: "warning",
});
for (const file of ["LICENSE", "LEGAL.md"])
  await copyFile(path.join(root, file), path.join(pkgDir, file));
console.log(`Built flux-downloader ${version} → packages/cli/dist/flux.mjs`);
