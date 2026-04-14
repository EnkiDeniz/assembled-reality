import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { compileSource } from "../LoegosCLI/packages/compiler/src/index.mjs";
import { evaluateCompilerRead } from "../src/lib/compiler-read.js";

const FIXTURES_ROOT = path.join(process.cwd(), "tests/fixtures/compiler-read");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readOptionalFile(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function compileFixtureSource(filePath, source) {
  return compileSource({
    filename: filePath,
    source,
  });
}

function listFixtureIds() {
  return readdirSync(FIXTURES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function assertOmissionPartition(compilerRead) {
  const selected = new Set(compilerRead?.translatedSubsetResult?.selectedClaimIds || []);
  const omitted = new Set(compilerRead?.translatedSubsetResult?.omittedClaims || []);
  const claimIds = new Set((compilerRead?.claimSet || []).map((claim) => claim.id));

  for (const id of claimIds) {
    assert.equal(selected.has(id) && omitted.has(id), false, `claim ${id} cannot be both selected and omitted`);
    assert.equal(selected.has(id) || omitted.has(id), true, `claim ${id} must be selected or omitted`);
  }
}

// This corpus is intentionally scoped to honesty and determinism.
// Reviewed usefulness of `primaryFinding` and `nextMoves` belongs in a separate layer.
test("compiler read corpus fixtures stay honest and deterministic", async (t) => {
  const fixtureIds = listFixtureIds();
  assert.ok(fixtureIds.length >= 6, "expected the initial compiler-read corpus fixtures");

  for (const fixtureId of fixtureIds) {
    await t.test(fixtureId, () => {
      const fixtureDir = path.join(FIXTURES_ROOT, fixtureId);
      const sourceFile = existsSync(path.join(fixtureDir, "source.md"))
        ? path.join(fixtureDir, "source.md")
        : path.join(fixtureDir, "source.loe");
      const sourceText = readFileSync(sourceFile, "utf8");
      const reviewedExtraction = readJson(path.join(fixtureDir, "reviewed-extraction.json"));
      const expectations = readJson(path.join(fixtureDir, "expectations.json"));
      const translatedSubsetSource = readOptionalFile(path.join(fixtureDir, "translated-subset.loe"));
      const embeddedProgramSource = readOptionalFile(path.join(fixtureDir, "embedded-program.loe"));

      const rawArtifact = compileFixtureSource(sourceFile, sourceText);
      assert.equal(rawArtifact.compileState, expectations.rawDocumentResult.expectedCompileState);
      assert.equal(rawArtifact.mergedWindowState, expectations.rawDocumentResult.expectedMergedWindowState);

      if (expectations.expectExcerptGroundingPass === false) {
        assert.throws(
          () =>
            evaluateCompilerRead({
              documentId: fixtureId,
              title: fixtureId,
              text: sourceText,
              extracted: reviewedExtraction,
            }),
          /source excerpt is not present in the document/i,
        );
        return;
      }

      const compilerRead = evaluateCompilerRead({
        documentId: fixtureId,
        title: fixtureId,
        text: sourceText,
        extracted: reviewedExtraction,
      });

      assert.equal(
        compilerRead.rawDocumentResult.compileState,
        expectations.rawDocumentResult.expectedCompileState,
      );
      assert.equal(
        compilerRead.rawDocumentResult.mergedWindowState,
        expectations.rawDocumentResult.expectedMergedWindowState,
      );

      if (!expectations.rawDocumentResult.assertSecondaryRuntimeState) {
        assert.equal(compilerRead.rawDocumentResult.secondaryRuntimeTrusted, false);
      }

      assert.equal(compilerRead.limitationClass, expectations.limitationClass);
      assert.equal(compilerRead.outcomeClass, expectations.outcomeClass);
      assert.equal(expectations.expectExcerptGroundingPass, true);

      assert.equal(
        Boolean(compilerRead.translatedSubsetResult.present),
        expectations.translatedSubsetResult.present,
      );
      assert.equal(
        Boolean(compilerRead.embeddedExecutableResult.present),
        expectations.embeddedExecutableResult.present,
      );

      if (expectations.expectOmissionReportingPass) {
        assertOmissionPartition(compilerRead);
      }

      if (expectations.translatedSubsetResult.present) {
        assert.equal(
          compilerRead.translatedSubsetResult.compileState,
          expectations.translatedSubsetResult.expectedCompileState,
        );
        assert.equal(
          compilerRead.translatedSubsetResult.mergedWindowState,
          expectations.translatedSubsetResult.expectedMergedWindowState,
        );
        assert.equal(compilerRead.translatedSubsetResult.source.trim(), translatedSubsetSource.trim());

        const translatedArtifact = compileFixtureSource(
          path.join(fixtureDir, "translated-subset.loe"),
          translatedSubsetSource,
        );
        assert.equal(translatedArtifact.compileState, compilerRead.translatedSubsetResult.compileState);
        assert.equal(
          translatedArtifact.mergedWindowState,
          compilerRead.translatedSubsetResult.mergedWindowState,
        );
      } else {
        assert.equal(compilerRead.translatedSubsetResult.compileState, "not_run");
      }

      if (expectations.embeddedExecutableResult.present) {
        assert.equal(
          compilerRead.embeddedExecutableResult.compileState,
          expectations.embeddedExecutableResult.expectedCompileState,
        );
        assert.equal(
          compilerRead.embeddedExecutableResult.mergedWindowState,
          expectations.embeddedExecutableResult.expectedMergedWindowState,
        );
        assert.equal(compilerRead.embeddedExecutableResult.source.trim(), embeddedProgramSource.trim());
        assert.ok(compilerRead.embeddedExecutableResult.detectionMethod);

        const embeddedArtifact = compileFixtureSource(
          path.join(fixtureDir, "embedded-program.loe"),
          embeddedProgramSource,
        );
        assert.equal(embeddedArtifact.compileState, compilerRead.embeddedExecutableResult.compileState);
        assert.equal(
          embeddedArtifact.mergedWindowState,
          compilerRead.embeddedExecutableResult.mergedWindowState,
        );
      } else {
        assert.equal(compilerRead.embeddedExecutableResult.compileState, "not_run");
      }
    });
  }
});
