import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const executable = process.platform === "win32"
  ? path.join(root, "release", `TakeBinder-win32-${process.arch}`, "TakeBinder.exe")
  : process.platform === "darwin"
    ? path.join(root, "release", "TakeBinder.app", "Contents", "MacOS", "Electron")
    : path.join(root, "release", `TakeBinder-linux-${process.arch}`, "takebinder");
const args = process.platform === "linux" && process.env.CI ? ["--no-sandbox", "--smoke-test"] : ["--smoke-test"];
const result = spawnSync(executable, args, {
  stdio: "inherit",
  shell: false,
  windowsHide: true,
  env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" }
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
