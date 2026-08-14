import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const executable = fileURLToPath(new URL(`../bin/takebinder-backend${process.platform === "win32" ? ".exe" : ""}`, import.meta.url));
const child = spawn(executable, [], { stdio: ["pipe", "pipe", "inherit"], shell: false, windowsHide: true });
const messages = [];
createInterface({ input: child.stdout }).on("line", (line) => messages.push(JSON.parse(line)));

child.stdin.write('{broken json}\n');
child.stdin.write(`${JSON.stringify({ protocolVersion: "2", requestId: "version", type: "status", payload: {} })}\n`);
child.stdin.write(`${JSON.stringify({ protocolVersion: "1", requestId: "unknown", type: "unknown", payload: {} })}\n`);
child.stdin.end(`${JSON.stringify({ protocolVersion: "1", requestId: "status", type: "status", payload: {} })}\n`);

const exitCode = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { child.kill(); reject(new Error("backend protocol test timed out")); }, 5000);
  child.once("error", reject);
  child.once("exit", (code) => { clearTimeout(timeout); resolve(code); });
});

if (exitCode !== 0) throw new Error(`backend exited with ${exitCode}`);
if (messages.length !== 4) throw new Error(`expected 4 responses, got ${messages.length}`);
for (const message of messages) {
  if (message.protocolVersion !== "1" || typeof message.requestId !== "string" || typeof message.type !== "string" || !("payload" in message)) {
    throw new Error(`invalid envelope: ${JSON.stringify(message)}`);
  }
}
const byRequest = new Map(messages.map((message) => [message.requestId, message]));
if (messages[0].type !== "error" || messages[0].payload.code !== "E_BAD_REQUEST") throw new Error("malformed JSON contract failed");
if (byRequest.get("version")?.payload.code !== "E_PROTOCOL") throw new Error("version contract failed");
if (byRequest.get("unknown")?.payload.code !== "E_BAD_REQUEST") throw new Error("unknown command contract failed");
if (byRequest.get("status")?.type !== "status.completed") throw new Error("status contract failed after malformed input");

console.log("JSON Lines protocol contract: OK");
