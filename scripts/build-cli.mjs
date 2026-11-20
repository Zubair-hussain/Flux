// Bundles the `flux` CLI into one dependency-free file: packages/cli/dist/flux.mjs
import { build } from "esbuild";
import { copyFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

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
const publicDir = path.join(root, "public/downloads");
await mkdir(publicDir, { recursive: true });
await copyFile(
  path.join(pkgDir, "dist/flux.mjs"),
  path.join(publicDir, "flux.mjs"),
);
for (const file of ["LICENSE", "LEGAL.md"])
  await copyFile(path.join(root, file), path.join(publicDir, file));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this script through npm run build:cli.");
const { stdout } = await promisify(execFile)(
  process.execPath,
  [
    npmCli,
    "pack",
    pkgDir,
    "--ignore-scripts",
    "--pack-destination",
    publicDir,
    "--json",
  ],
  { cwd: root, windowsHide: true },
);
const [packed] = JSON.parse(stdout);
console.log(
  `Packaged ${packed.filename} (${packed.size} bytes) for direct npm installation.`,
);
console.log(`Built flux-downloader ${version} → packages/cli/dist/flux.mjs`);
