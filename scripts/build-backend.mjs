import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

mkdirSync("bin", { recursive: true });
const name = process.platform === "win32" ? "gopro-joiner-backend.exe" : "gopro-joiner-backend";
const output = fileURLToPath(new URL(`../bin/${name}`, import.meta.url));
const cwd = fileURLToPath(new URL("../backend", import.meta.url));
const env = { ...process.env, GOCACHE: fileURLToPath(new URL("../.cache/go-build", import.meta.url)) };
const result = spawnSync("go", ["build", "-o", output, "."], { cwd, stdio: "inherit", shell: false, env });
process.exit(result.status ?? 1);
