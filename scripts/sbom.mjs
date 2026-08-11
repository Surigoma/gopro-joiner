import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(root, "release", "sbom.cdx.json");
const corepack = path.join(path.dirname(process.execPath), "node_modules", "corepack", "dist", "corepack.js");
const command = existsSync(corepack) ? process.execPath : "corepack";
const args = [...(existsSync(corepack) ? [corepack] : []), "yarn", "info", "-A", "-R", "--json"];
const result = spawnSync(command, args, { cwd: root, encoding: "utf8", shell: false, windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || `yarn info exited with ${result.status}`);

const components = new Map();
for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
  const item = JSON.parse(line);
  const version = item.children?.Version;
  if (!version || item.value.includes("@workspace:")) continue;
  const name = packageName(item.value);
  components.set(`${name}@${version}`, { type: "library", name, version, purl: `pkg:npm/${purlName(name)}@${version}` });
}
const list = [...components.values()].sort((a, b) => a.purl.localeCompare(b.purl));
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const sbom = { bomFormat: "CycloneDX", specVersion: "1.6", version: 1, metadata: { component: { type: "application", name: packageJson.name, version: packageJson.version } }, components: list };

if (process.argv.includes("--verify")) {
  const current = JSON.parse(readFileSync(output, "utf8"));
  if (JSON.stringify(current) !== JSON.stringify(sbom)) throw new Error("SBOM does not match the locked Yarn dependency graph");
  console.log(`SBOM verified: ${list.length} components`);
} else {
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(sbom, null, 2)}\n`);
  console.log(`SBOM generated: ${list.length} components`);
}

function packageName(locator) {
  const separator = locator.startsWith("@") ? locator.indexOf("@", locator.indexOf("/") + 1) : locator.indexOf("@");
  return locator.slice(0, separator);
}

function purlName(name) {
  if (!name.startsWith("@")) return encodeURIComponent(name);
  const [scope, packageName] = name.slice(1).split("/");
  return `%40${encodeURIComponent(scope)}/${encodeURIComponent(packageName)}`;
}
