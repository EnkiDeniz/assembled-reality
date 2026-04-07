import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const openAiApiKey = String(process.env.OPENAI_API_KEY || "").trim();
const baseUrl = String(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3003").trim();

if (!openAiApiKey) {
  console.error("phase1-e2e-local: OPENAI_API_KEY is required for the proof loop.");
  process.exit(1);
}

function runChild(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited via signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code ?? 1}`));
        return;
      }

      resolve();
    });
  });
}

async function prewarmLocalProofRoute() {
  const cookieJar = join(tmpdir(), `phase1-e2e-local-${Date.now().toString(36)}.cookies`);
  const bootstrapStartedAt = Date.now();
  await runChild("curl", [
    "-fsS",
    "-m",
    "900",
    "-c",
    cookieJar,
    `${baseUrl}/api/auth/dev-guardian`,
    "-o",
    "/tmp/phase1-e2e-local-auth.json",
  ]);
  console.log(
    `phase1-e2e-local: prewarmed guardian auth in ${Date.now() - bootstrapStartedAt}ms`,
  );

  const workspaceStartedAt = Date.now();
  await runChild("curl", [
    "-fsSL",
    "-m",
    "900",
    "-b",
    cookieJar,
    `${baseUrl}/workspace`,
    "-o",
    "/tmp/phase1-e2e-local-workspace.html",
  ]);

  console.log(
    `phase1-e2e-local: prewarmed /workspace in ${Date.now() - workspaceStartedAt}ms`,
  );
}

async function main() {
  await prewarmLocalProofRoute();

  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["playwright", "test", "--config=playwright.config.mjs", ...process.argv.slice(2)],
    {
      stdio: "inherit",
      env: process.env,
    },
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
