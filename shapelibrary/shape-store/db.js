import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "shapelibrary.db");

function removeIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}

function reopenFreshDatabase() {
  removeIfExists(DB_PATH);
  removeIfExists(`${DB_PATH}-wal`);
  removeIfExists(`${DB_PATH}-shm`);
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}

export function openDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    return db;
  } catch (error) {
    const code = String(error?.code || "");
    if (code.startsWith("SQLITE_IOERR")) {
      return reopenFreshDatabase();
    }
    throw error;
  }
}

function tableHasColumn(db, tableName, columnName) {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return cols.some((c) => c.name === columnName);
}

function ensureColumn(db, table, column, definition) {
  if (!tableHasColumn(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ShapeRun (
      runId TEXT PRIMARY KEY,
      runType TEXT NOT NULL,
      inputMode TEXT NOT NULL,
      mode TEXT NOT NULL,
      intentLayer TEXT NOT NULL,
      granularity TEXT NOT NULL,
      resultType TEXT NOT NULL,
      confidence REAL NOT NULL,
      confidenceSource TEXT NOT NULL,
      modelVersion TEXT,
      promptHash TEXT,
      traceJson TEXT,
      readsJson TEXT,
      gateJson TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ShapeEpisode (
      episodeId TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      expectedJson TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ShapeCandidate (
      candidateId TEXT PRIMARY KEY,
      runId TEXT NOT NULL,
      resultType TEXT NOT NULL,
      granularity TEXT NOT NULL,
      invariant TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ShapePrimitive (
      shapeId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invariantText TEXT NOT NULL,
      status TEXT NOT NULL,
      metadataJson TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ShapeAssembly (
      shapeId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invariantText TEXT NOT NULL,
      status TEXT NOT NULL,
      metadataJson TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ShapeEdgeRule (
      edgeId TEXT PRIMARY KEY,
      assemblyId TEXT NOT NULL,
      fromShapeId TEXT NOT NULL,
      toShapeId TEXT NOT NULL,
      edgeType TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ShapePromotionDecision (
      decisionId TEXT PRIMARY KEY,
      candidateId TEXT NOT NULL,
      targetType TEXT NOT NULL,
      fromState TEXT NOT NULL,
      toState TEXT NOT NULL,
      approved INTEGER NOT NULL,
      rationale TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ShapeReceipt (
      receiptId TEXT PRIMARY KEY,
      candidateId TEXT NOT NULL,
      receiptType TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      accepted INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  let ver = Number(db.pragma("user_version", { simple: true }) || 0);
  if (ver < 1) {
    ensureColumn(db, "ShapeRun", "kernelState", "TEXT");
    ensureColumn(db, "ShapeRun", "kernelTraceJson", "TEXT");
    ensureColumn(db, "ShapeRun", "convergenceScore", "REAL");
    ensureColumn(db, "ShapeRun", "domainMapJson", "TEXT");
    ensureColumn(db, "ShapeRun", "isMythDerived", "INTEGER");
    ensureColumn(db, "ShapeCandidate", "linkedShapeId", "TEXT");
    ensureColumn(db, "ShapeCandidate", "libraryMergeStatus", "TEXT");
    ensureColumn(db, "ShapeCandidate", "kernelState", "TEXT");
    ensureColumn(db, "ShapeCandidate", "convergenceScore", "REAL");
    ensureColumn(db, "ShapeCandidate", "domainMapJson", "TEXT");
    ensureColumn(db, "ShapeCandidate", "isMythDerived", "INTEGER");
    db.pragma("user_version = 1");
    ver = 1;
  }

  if (ver < 2) {
    ensureColumn(db, "ShapeRun", "assemblyClass", "TEXT");
    ensureColumn(db, "ShapeRun", "maturationJson", "TEXT");
    ensureColumn(db, "ShapeCandidate", "assemblyClass", "TEXT");
    ensureColumn(db, "ShapeCandidate", "maturationJson", "TEXT");
    db.pragma("user_version = 2");
  }
}
