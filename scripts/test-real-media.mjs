import { spawn } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const inputDir = process.env.TAKEBINDER_REAL_INPUT;
const outputDir = process.env.TAKEBINDER_REAL_OUTPUT;
if (!inputDir || !outputDir) throw new Error("TAKEBINDER_REAL_INPUT and TAKEBINDER_REAL_OUTPUT are required");
const backend = path.join(root, "bin", `takebinder-backend${process.platform === "win32" ? ".exe" : ""}`);
const before = snapshot(inputDir);
const child = spawn(backend, [], { stdio: ["pipe", "pipe", "inherit"], shell: false, windowsHide: true, env: process.env });
const result = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { child.kill(); reject(new Error("real media test timed out")); }, 45 * 60 * 1000);
  child.once("error", reject);
  createInterface({ input: child.stdout }).on("line", (line) => {
    const event = JSON.parse(line);
    if (event.type === "error") reject(new Error(`${event.payload.code}: ${event.payload.message}`));
    if (event.type === "scan.completed") {
      if (event.payload.groups.length !== 1 || event.payload.groups[0].status !== "ready") reject(new Error(`unexpected scan result: ${line}`));
      child.stdin.write(`${JSON.stringify({ protocolVersion: "1", requestId: "real-run", type: "run", payload: { outputDir, maxParallel: 1, strictHash: true, dateFolders: false, copyOriginals: false, preserveFolders: false, writeReport: true, groups: event.payload.groups } })}\n`);
    }
    if (event.type === "run.completed") {
      clearTimeout(timeout);
      resolve(event.payload);
      child.stdin.end();
    }
  });
  child.stdin.write(`${JSON.stringify({ protocolVersion: "1", requestId: "real-scan", type: "scan", payload: { inputDir, outputDir, recursive: true } })}\n`);
});
const after = snapshot(inputDir);
if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("input files changed during the real media test");
if (result.results.length !== 1 || !["completed", "skipped"].includes(result.results[0].status) || !["verified", "byte-identical"].includes(result.results[0].gpmfVerification)) {
  throw new Error(`real media verification failed: ${JSON.stringify(result)}`);
}
console.log(`Real GoPro media verified without input changes: ${result.results[0].outputPath}`);

function snapshot(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const file = path.join(directory, entry.name);
      const stat = statSync(file);
      return { name: entry.name, size: stat.size, modified: stat.mtimeMs };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
