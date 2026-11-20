// `flux` command-line downloader: the same platforms, quality rules and content
// policy as the Flux web app, in one cross-platform command.
import { execFile, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { platforms, qualityLabel, type Quality } from "../lib/platforms";
import { AppError, enforceContentPolicy, validateUrl } from "../lib/policy";
import {
  downloadSafetyArgs,
  formatSelector,
  sourceQualities,
  ytdlpCommand,
} from "../lib/ytdlp";

declare const __FLUX_VERSION__: string;
export const version =
  typeof __FLUX_VERSION__ === "string" ? __FLUX_VERSION__ : "0.0.0-dev";
export const repoUrl = "https://github.com/Zubair-hussain/Flux";
export const installEngine =
  'python -m pip install -U "yt-dlp[default,curl-cffi]"';

const exec = promisify(execFile);

export type Options = {
  command: "download" | "info" | "platforms" | "doctor" | "help" | "version";
  url?: string;
  quality?: Quality | "best";
  output: string;
  json: boolean;
};

const qualityAliases: Record<string, Quality | "best"> = {
  best: "best",
  "720": 720,
  "720p": 720,
  hd: 720,
  "1080": 1080,
  "1080p": 1080,
  fhd: 1080,
  "1440": 1440,
  "1440p": 1440,
  "2k": 1440,
  "2160": 2160,
  "2160p": 2160,
  "4k": 2160,
  "4320": 4320,
  "4320p": 4320,
  "8k": 4320,
};

export function parseArgs(argv: string[], cwd = process.cwd()): Options {
  const options: Options = { command: "download", output: cwd, json: false };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined || next.startsWith("-"))
        throw new AppError(`${arg} needs a value.`);
      return next;
    };
    if (arg === "-h" || arg === "--help") options.command = "help";
    else if (arg === "-v" || arg === "--version") options.command = "version";
    else if (arg === "--json") options.json = true;
    else if (arg === "-q" || arg === "--quality") {
      const q = qualityAliases[value().toLowerCase()];
      if (!q)
        throw new AppError("Quality must be 720, 1080, 1440, 4k, 8k or best.");
      options.quality = q;
    } else if (arg === "-o" || arg === "--output")
      options.output = path.resolve(cwd, value());
    else if (arg.startsWith("-")) throw new AppError(`Unknown option: ${arg}`);
    else rest.push(arg);
  }
  if (options.command === "help" || options.command === "version")
    return options;
  const [first, second] = rest;
  if (first === "info" || first === "download") {
    options.command = first;
    options.url = second;
  } else if (first === "platforms" || first === "doctor") {
    options.command = first;
  } else if (first) {
    options.url = first;
  } else options.command = "help";
  if (
    (options.command === "info" || options.command === "download") &&
    !options.url
  )
    throw new AppError(
      `Add a video URL, for example: flux ${options.command} https://youtu.be/...`,
    );
  return options;
}

export function pickQuality(
  available: Quality[],
  requested: Quality | "best" = "best",
): Quality {
  if (requested === "best") return available.at(-1)!;
  if (!available.includes(requested))
    throw new AppError(
      `This video does not offer ${qualityLabel(requested)}. Available: ${available.map(qualityLabel).join(", ")}.`,
    );
  return requested;
}

export const help = `Flux ${version}: download public videos in their original quality.

Usage
  flux <url>                 Download in the best quality the source offers
  flux <url> -q 1080         Download an exact resolution (720, 1080, 1440, 4k, 8k)
  flux info <url> [--json]   Show title, creator and available qualities
  flux platforms             List supported platforms
  flux doctor                Check that yt-dlp, FFmpeg and Node.js are ready

Options
  -q, --quality <q>   720 | 1080 | 1440 | 4k | 8k | best (default best)
  -o, --output <dir>  Folder to save into (default: current folder)
  --json              Machine-readable output for info
  -h, --help          Show this help
  -v, --version       Show the version

Only download videos you own or have permission to save. Flux never bypasses
DRM, sign-in or paywalls, and blocks live, age-restricted and sexual content.
Terms: ${repoUrl}/blob/_prod/LEGAL.md
`;

export type VideoDetails = {
  url: string;
  platform: string;
  title: string;
  creator: string;
  duration: number;
  qualities: Quality[];
  formatIds: Partial<Record<Quality, string>>;
};

function engineError(error: unknown): never {
  const e = error as { code?: string; stderr?: string };
  if (e.code === "ENOENT" || e.stderr?.includes("No module named yt_dlp"))
    throw new AppError(`Download engine missing. Run: ${installEngine}`, 503);
  throw new AppError(
    "The source could not be accessed. It may require sign-in, restrict downloads, or be temporarily unavailable.",
    422,
  );
}

export async function inspect(input: string): Promise<VideoDetails> {
  const { url, platform } = validateUrl(input);
  const command = ytdlpCommand([
    "--dump-single-json",
    "--skip-download",
    "--",
    url,
  ]);
  let stdout: string;
  try {
    ({ stdout } = await exec(command.binary, command.args, {
      timeout: 90_000,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    }));
  } catch (error) {
    engineError(error);
  }
  const info = JSON.parse(stdout);
  enforceContentPolicy(info);
  const { qualities, formatIds } = sourceQualities(info.formats);
  return {
    url,
    platform,
    title: String(info.title).slice(0, 300),
    creator: String(info.uploader || info.channel || platform).slice(0, 100),
    duration: Number(info.duration) || 0,
    qualities,
    formatIds,
  };
}

function runDownload(binary: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, {
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true,
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new AppError(
              `The download stopped (yt-dlp exit code ${code}).`,
              422,
            ),
          ),
    );
  });
}

async function hasCommand(binary: string, args: string[]) {
  try {
    const { stdout, stderr } = await exec(binary, args, {
      timeout: 20_000,
      windowsHide: true,
    });
    return (stdout || stderr).split(/\r?\n/)[0].trim() || "found";
  } catch {
    return null;
  }
}

const minutes = (s: number) => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;

export async function main(
  argv: string[],
  log: (line: string) => void = console.log,
): Promise<number> {
  let options: Options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    log(`✖ ${(error as Error).message}\n\n${help}`);
    return 2;
  }
  try {
    switch (options.command) {
      case "help":
        log(help);
        return 0;
      case "version":
        log(version);
        return 0;
      case "platforms":
        log(
          `Supported platforms:\n${platforms.map((p) => `  • ${p.name} (${p.hosts.join(", ")})`).join("\n")}\n\nSome videos still need sign-in or are region-locked; Flux never asks for your account.`,
        );
        return 0;
      case "doctor": {
        const ytdlp = ytdlpCommand(["--version"]);
        const checks: [string, string | null, string][] = [
          [
            "Node.js",
            Number(process.versions.node.split(".")[0]) >= 22
              ? process.versions.node
              : null,
            "Install Node.js 22 or newer from https://nodejs.org",
          ],
          ["yt-dlp", await hasCommand(ytdlp.binary, ytdlp.args), installEngine],
          [
            "FFmpeg",
            await hasCommand(process.env.FFMPEG_PATH || "ffmpeg", ["-version"]),
            "Install FFmpeg (Windows: winget install Gyan.FFmpeg · macOS: brew install ffmpeg · Linux: apt install ffmpeg)",
          ],
        ];
        for (const [name, found, fix] of checks)
          log(found ? `✔ ${name}: ${found}` : `✖ ${name} missing → ${fix}`);
        return checks.every(([, found]) => found) ? 0 : 1;
      }
      case "info": {
        const video = await inspect(options.url!);
        if (options.json) {
          const { formatIds: _ids, ...rest } = video;
          log(JSON.stringify(rest, null, 2));
        } else
          log(
            `${video.title}\n  ${video.creator} · ${video.platform} · ${minutes(video.duration)}\n  Qualities: ${video.qualities.map(qualityLabel).join(", ")}`,
          );
        return 0;
      }
      case "download": {
        const video = await inspect(options.url!);
        const quality = pickQuality(video.qualities, options.quality);
        await mkdir(options.output, { recursive: true });
        log(
          `▶ ${video.title}\n  ${video.platform} · ${qualityLabel(quality)} → ${options.output}\n  Only keep videos you own or have permission to save.`,
        );
        const command = ytdlpCommand([
          ...downloadSafetyArgs,
          "--format",
          formatSelector(quality, video.formatIds[quality]),
          "--merge-output-format",
          "mkv",
          "--windows-filenames",
          "--output",
          path.join(options.output, "%(title).120B [%(id)s].%(ext)s"),
          "--",
          video.url,
        ]);
        try {
          await runDownload(command.binary, command.args);
        } catch (error) {
          if (error instanceof AppError) throw error;
          engineError(error);
        }
        log(`✔ Saved to ${options.output}`);
        return 0;
      }
    }
  } catch (error) {
    log(
      `✖ ${error instanceof AppError ? error.message.replace("Choose a platform shown on the homepage.", "Run flux platforms to see the list.") : "Unexpected error. Please retry."}`,
    );
    return 1;
  }
}
