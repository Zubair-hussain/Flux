import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const exec = promisify(execFile);
const source = path.resolve(process.argv[2] || "reports/wildlife-master.mp4");
const stories = JSON.parse(
  await readFile("videos/wildlife-wait/stories.json", "utf8"),
);
let total = 0;
for (const story of stories) {
  const file = path.resolve("public/animations/wildlife", `${story.id}.webm`);
  await exec(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(story.start),
      "-i",
      source,
      "-t",
      String(story.duration),
      "-an",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "34",
      "-deadline",
      "good",
      "-cpu-used",
      "4",
      "-row-mt",
      "1",
      "-threads",
      "2",
      "-pix_fmt",
      "yuv420p",
      file,
    ],
    { windowsHide: true, timeout: 120000 },
  );
  const result = await exec(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration",
      "-of",
      "json",
      file,
    ],
    { windowsHide: true },
  );
  const probe = JSON.parse(result.stdout);
  if (
    probe.streams.length !== 1 ||
    probe.streams[0].codec_name !== "vp9" ||
    probe.streams[0].width !== 768 ||
    Math.abs(Number(probe.format.duration) - story.duration) > 0.1
  ) {
    throw new Error(`Unexpected video or audio streams in ${story.id}`);
  }
  const { size } = await stat(file);
  total += size;
  console.log(
    `${story.id}: ${(size / 1024).toFixed(0)} KB, ${probe.format.duration}s, silent VP9`,
  );
}
console.log(
  `Verified ${stories.length} silent WebM clips; ${(total / 1024 / 1024).toFixed(2)} MB total.`,
);
