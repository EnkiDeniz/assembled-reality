import { pathToFileURL } from "node:url";

import { PHASE1_SAFE_UNCERTAINTY_SCENARIO } from "../tests/fixtures/room-benchmarks/phase1-safe-uncertainty.mjs";
import {
  PHASE1_MASTER_REPORT_PATH,
  runPhase1RoomBenchmark,
} from "../tests/helpers/run-phase1-room-benchmark.mjs";

export async function main() {
  process.env.ROOM_AI_COLLAB_OPENAI_MODEL = "gpt-5.4-mini";

  const result = await runPhase1RoomBenchmark(PHASE1_SAFE_UNCERTAINTY_SCENARIO, {
    cwd: process.cwd(),
    reportPath: PHASE1_MASTER_REPORT_PATH,
  });

  console.log(
    JSON.stringify(
      {
        ok: result.verdict.valid,
        reportPath: result.reportPath,
        winner: result.verdict.winner,
        scoreDelta: result.verdict.scoreDelta,
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
