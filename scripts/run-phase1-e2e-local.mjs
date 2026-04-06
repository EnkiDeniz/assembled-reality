import { spawn } from "node:child_process";

const openAiApiKey = String(process.env.OPENAI_API_KEY || "").trim();

if (!openAiApiKey) {
  console.error("phase1-e2e-local: OPENAI_API_KEY is required for the proof loop.");
  process.exit(1);
}

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

