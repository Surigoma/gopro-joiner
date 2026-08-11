import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const env = { ...process.env, GOCACHE: fileURLToPath(new URL("../.cache/go-build", import.meta.url)) };
const cwd = fileURLToPath(new URL("../backend", import.meta.url));
const result = spawnSync("go", ["test", "./..."], { cwd, stdio: "inherit", shell: false, env });
process.exit(result.status ?? 1);
