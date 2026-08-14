import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, createReadStream, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const electron = path.join(root, "node_modules", "electron", "dist");
const backendName = process.platform === "win32" ? "takebinder-backend.exe" : "takebinder-backend";
const backend = path.join(root, "bin", backendName);
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

for (const required of [backend, path.join(root, "dist", "main.js"), path.join(root, "dist", "preload.js"), path.join(root, "dist", "ui", "index.html")]) {
  if (!existsSync(required)) throw new Error(`missing build input: ${required}`);
}

let target;
let resources;
if (process.platform === "darwin") {
  target = path.join(root, "release", "TakeBinder.app");
  rmSync(target, { recursive: true, force: true });
  cpSync(path.join(electron, "Electron.app"), target, { recursive: true, verbatimSymlinks: true });
  resources = path.join(target, "Contents", "Resources");
} else {
  target = path.join(root, "release", `TakeBinder-${process.platform}-${process.arch}`);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(electron, target, { recursive: true });
  const original = path.join(target, process.platform === "win32" ? "electron.exe" : "electron");
  renameSync(original, path.join(target, process.platform === "win32" ? "TakeBinder.exe" : "takebinder"));
  resources = path.join(target, "resources");
}

const app = path.join(resources, "app");
cpSync(path.join(root, "dist"), path.join(app, "dist"), { recursive: true });
writeFileSync(path.join(app, "package.json"), JSON.stringify({
  name: packageJson.name,
  productName: "TakeBinder",
  version: packageJson.version,
  private: true,
  main: "dist/main.js"
}, null, 2));
mkdirSync(path.join(resources, "bin"), { recursive: true });
cpSync(backend, path.join(resources, "bin", backendName));
cpSync(path.join(root, "README.md"), path.join(resources, "README.md"));
cpSync(path.join(root, "README.ja.md"), path.join(resources, "README.ja.md"));
cpSync(path.join(root, "release", "sbom.cdx.json"), path.join(resources, "sbom.cdx.json"));

const status = spawnSync(backend, [], {
  input: `${JSON.stringify({ protocolVersion: "1", requestId: "manifest", type: "status", payload: {} })}\n`,
  encoding: "utf8",
  shell: false,
  windowsHide: true,
  env: { ...process.env, TAKEBINDER_TOOLS_DIR: "" }
});
if (status.status !== 0) throw new Error(`backend status failed: ${status.stderr}`);
const nativeTools = JSON.parse(status.stdout.trim()).payload.tools;
const manifestPath = path.join(resources, "release-manifest.json");
const artifacts = [];
for (const file of walkFiles(target)) {
  if (file === manifestPath) continue;
  const relative = path.relative(target, file).split(path.sep).join("/");
  const stat = lstatSync(file);
  if (stat.isSymbolicLink()) {
    artifacts.push({ path: relative, link: readlinkSync(file) });
  } else if (stat.isFile()) {
    artifacts.push({ path: relative, size: stat.size, sha256: await hashFile(file) });
  }
}
artifacts.sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(manifestPath, `${JSON.stringify({ application: "TakeBinder", version: packageJson.version, platform: process.platform, arch: process.arch, artifacts, nativeTools }, null, 2)}\n`);

console.log(target);

function walkFiles(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walkFiles(item));
    else result.push(item);
  }
  return result;
}

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(file).on("data", (chunk) => hash.update(chunk)).once("error", reject).once("end", () => resolve(hash.digest("hex")));
  });
}
