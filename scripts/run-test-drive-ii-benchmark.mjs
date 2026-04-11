import { pathToFileURL } from "node:url";

import {
  TEST_DRIVE_II_MASTER_REPORT_PATH,
  runTestDriveIiBenchmark,
} from "../tests/helpers/run-test-drive-ii-benchmark.mjs";

export async function main() {
  process.env.ROOM_AI_COLLAB_OPENAI_MODEL = "gpt-5.4-mini";

  const result = await runTestDriveIiBenchmark({
    cwd: process.cwd(),
    reportPath: TEST_DRIVE_II_MASTER_REPORT_PATH,
  });

  console.log(
    JSON.stringify(
      {
        ok: result.verdict.valid,
        reportPath: result.reportPath,
        winner: result.verdict.winner,
        headlineValid: result.verdict.headlineValid,
      },
      null,
      2,
    ),
  );

  if (!result.verdict.valid) {
    process.exitCode = 1;
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  });
}
