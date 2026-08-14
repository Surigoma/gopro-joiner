import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const samples = path.join(root, ".cache", "gpmf-parser", "samples");
const work = path.join(root, ".cache", "media-matrix");
const inputDir = path.join(work, "input");
const outputDir = path.join(work, "output");
const backend = path.join(root, "bin", `takebinder-backend${process.platform === "win32" ? ".exe" : ""}`);
const cases = [
  ["hero5.mp4", "GX010205.MP4", "GX020205.MP4"],
  ["hero8.mp4", "GX010208.MP4", "GX020208.MP4"],
  ["max-heromode.mp4", "GX010219.MP4", "GX020219.MP4"]
];

for (const [source] of cases) if (!existsSync(path.join(samples, source))) throw new Error(`official GoPro sample is missing: ${source}`);
rmSync(work, { recursive: true, force: true });
mkdirSync(inputDir, { recursive: true });
mkdirSync(outputDir, { recursive: true });
for (const [source, first, second] of cases) {
  cpSync(path.join(samples, source), path.join(inputDir, first));
  cpSync(path.join(samples, source), path.join(inputDir, second));
}
const ffmpegName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
const managedFFmpeg = process.env.TAKEBINDER_TOOLS_DIR ? path.join(process.env.TAKEBINDER_TOOLS_DIR, "ffmpeg", "8.1.2-1", ffmpegName) : "";
const ffmpeg = managedFFmpeg && existsSync(managedFFmpeg) ? managedFFmpeg : ffmpegName;
const hdrSource = path.join(work, "hero8-hdr.mp4");
const hdr = spawnSync(ffmpeg, [
  "-v", "error", "-nostdin", "-y", "-i", path.join(samples, "hero8.mp4"),
  "-map", "0:0", "-map", "0:1", "-map", "0:3", "-c:v", "libx265", "-preset", "ultrafast",
  "-vf", "setparams=color_primaries=bt2020:color_trc=smpte2084:colorspace=bt2020nc",
  "-c:a", "copy", "-c:d", "copy", "-copy_unknown", hdrSource
], { encoding: "utf8", shell: false, windowsHide: true });
if (hdr.error) throw hdr.error;
if (hdr.status !== 0) throw new Error(`HDR fixture creation failed: ${hdr.stderr}`);
cpSync(hdrSource, path.join(inputDir, "GX010220.MP4"));
cpSync(hdrSource, path.join(inputDir, "GX020220.MP4"));
const expectedGroups = cases.length + 1;

const child = spawn(backend, [], { stdio: ["pipe", "pipe", "inherit"], shell: false, windowsHide: true, env: process.env });
const result = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { child.kill(); reject(new Error("media matrix timed out")); }, 10 * 60 * 1000);
  child.once("error", reject);
  createInterface({ input: child.stdout }).on("line", (line) => {
    const event = JSON.parse(line);
    if (event.type === "error") reject(new Error(`${event.payload.code}: ${event.payload.message}`));
    if (event.type === "scan.completed") {
      if (event.payload.groups.length !== expectedGroups || event.payload.groups.some((group) => group.status !== "ready")) reject(new Error(`unexpected scan result: ${line}`));
      child.stdin.write(`${JSON.stringify({ protocolVersion: "1", requestId: "matrix-run", type: "run", payload: { outputDir, maxParallel: 2, strictHash: true, dateFolders: false, copyOriginals: false, preserveFolders: false, writeReport: true, groups: event.payload.groups } })}\n`);
    }
    if (event.type === "run.completed") {
      clearTimeout(timeout);
      resolve(event.payload);
      child.stdin.end();
    }
  });
  child.stdin.write(`${JSON.stringify({ protocolVersion: "1", requestId: "matrix-scan", type: "scan", payload: { inputDir, outputDir, recursive: true } })}\n`);
});

if (result.results.length !== expectedGroups || result.results.some((item) => item.status !== "completed" || item.gpmfVerification !== "verified")) {
  throw new Error(`media matrix verification failed: ${JSON.stringify(result)}`);
}
const videoStreams = result.results.map((item) => item.outputStreams?.find((stream) => stream.type === "video"));
if (videoStreams.filter((stream) => stream?.codec === "h264").length !== cases.length || !videoStreams.some((stream) => stream?.codec === "hevc" && stream.colorTransfer === "smpte2084")) {
  throw new Error(`codec/HDR matrix verification failed: ${JSON.stringify(videoStreams)}`);
}
console.log(`GoPro media matrix: ${cases.length} H.264 generations and synthetic HEVC PQ verified`);
