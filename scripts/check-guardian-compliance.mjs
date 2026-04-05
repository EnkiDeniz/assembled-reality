import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const JS_SCAN_ROOTS = [
  path.join(ROOT, "src", "app"),
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "lib"),
];
const JS_ALLOWED_FILES = new Set([
  path.join(ROOT, "src", "lib", "design-tokens.js"),
]);
const CSS_GRADIENT_FILES = [
  path.join(ROOT, "src", "app", "styles", "layout.css"),
  path.join(ROOT, "src", "app", "styles", "surfaces.css"),
];
const COLOR_RE = /#[0-9A-Fa-f]{3,8}\b|rgba?\(|hsla?\(|linear-gradient|radial-gradient/g;
const GRADIENT_RE = /linear-gradient|radial-gradient/g;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walk(target);
      }
      return target;
    }),
  );
  return files.flat();
}

function formatLocation(filePath, index, source) {
  const upToMatch = source.slice(0, index);
  return upToMatch.split("\n").length;
}

async function collectViolations() {
  const violations = [];

  const jsFiles = (
    await Promise.all(JS_SCAN_ROOTS.map((scanRoot) => walk(scanRoot)))
  )
    .flat()
    .filter((filePath) => [".js", ".jsx"].includes(path.extname(filePath)))
    .filter((filePath) => !JS_ALLOWED_FILES.has(filePath));

  for (const filePath of jsFiles) {
    const source = await readFile(filePath, "utf8");
    let match;
    while ((match = COLOR_RE.exec(source))) {
      violations.push({
        filePath,
        line: formatLocation(filePath, match.index, source),
        match: match[0],
        kind: "raw-color",
      });
    }
    COLOR_RE.lastIndex = 0;
  }

  for (const filePath of CSS_GRADIENT_FILES) {
    const source = await readFile(filePath, "utf8");
    let match;
    while ((match = GRADIENT_RE.exec(source))) {
      violations.push({
        filePath,
        line: formatLocation(filePath, match.index, source),
        match: match[0],
        kind: "decorative-gradient",
      });
    }
    GRADIENT_RE.lastIndex = 0;
  }

  return violations;
}

const violations = await collectViolations();

if (violations.length) {
  console.error("Guardian compliance check failed:\n");
  violations.forEach((violation) => {
    console.error(
      `${path.relative(ROOT, violation.filePath)}:${violation.line} ${violation.kind} ${violation.match}`,
    );
  });
  process.exit(1);
}

console.log("Guardian compliance check passed.");
