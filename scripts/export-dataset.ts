#!/usr/bin/env tsx
/**
 * Versioned dataset export — the whole knowledge graph as a portable, pinnable
 * artifact so consumers can build on Body IQ without standing up Postgres.
 *
 * Emits to exports/dataset/:
 *   body-iq-dataset.json         full normalized graph (per-type collections + links)
 *   manifest.json                schema version, counts, git SHA, generatedAt
 *   body-iq-dataset.schema.json  JSON-Schema contract for the bundle shape
 *   body-iq.sql                  SQLite-loadable dump (sqlite3 body-iq.db < body-iq.sql)
 *   README.md                    how to consume + provenance
 *
 * Keys: every record carries a globally-unique `id` (cuid) and a per-type
 * `slug`. Consumers should key on (type, slug) or on `id`.
 *
 * Run: pnpm export:dataset
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const SCHEMA_VERSION = 1;
const OUT = join(process.cwd(), "exports", "dataset");

function gitSha(): string {
  try { return execSync("git rev-parse --short HEAD").toString().trim(); } catch { return "unknown"; }
}
function pkgVersion(): string {
  try { return JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")).version; } catch { return "0.0.0"; }
}

// ── SQLite dump helpers (no native dependency; a plain .sql a consumer loads) ──
function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlType(v: unknown): string {
  if (typeof v === "number") return Number.isInteger(v) ? "INTEGER" : "REAL";
  if (typeof v === "boolean") return "INTEGER";
  return "TEXT";
}
function toSqlTable(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- ${table}: (empty)\n\n`;
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const types = cols.map((c) => { const s = rows.find((r) => r[c] != null); return sqlType(s ? s[c] : ""); });
  let sql = `DROP TABLE IF EXISTS "${table}";\nCREATE TABLE "${table}" (\n  ${cols.map((c, i) => `"${c}" ${types[i]}`).join(",\n  ")}\n);\n`;
  for (const r of rows) {
    sql += `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map((c) => sqlValue(r[c])).join(", ")});\n`;
  }
  return sql + "\n";
}

async function main() {
  // Full graph — entities then weighted links. Scalars only (no include),
  // so every relation is expressed as an id-keyed row in a link collection.
  const collections: Record<string, Record<string, unknown>[]> = {
    regions: await prisma.region.findMany({ orderBy: { sortOrder: "asc" } }),
    joints: await prisma.joint.findMany({ orderBy: { slug: "asc" } }),
    movements: await prisma.movement.findMany({ orderBy: { slug: "asc" } }),
    muscles: await prisma.muscle.findMany({ orderBy: { slug: "asc" } }),
    functionalTasks: await prisma.functionalTask.findMany({ orderBy: { slug: "asc" } }),
    goals: await prisma.goal.findMany({ orderBy: { slug: "asc" } }),
    exercises: await prisma.exercise.findMany({ orderBy: { slug: "asc" } }),
    gaitPhases: await prisma.gaitPhase.findMany(),
    sources: await prisma.researchSource.findMany({ orderBy: { slug: "asc" } }),
    // weighted / relational links
    movementMuscles: await prisma.movementMuscle.findMany(),
    exerciseMuscles: await prisma.exerciseMuscle.findMany(),
    exerciseMovements: await prisma.exerciseMovement.findMany(),
    exerciseFunctionalTasks: await prisma.exerciseFunctionalTask.findMany(),
    movementFunctionalTasks: await prisma.movementFunctionalTask.findMany(),
    exerciseGoals: await prisma.exerciseGoal.findMany(),
    exerciseGaitPhases: await prisma.exerciseGaitPhase.findMany(),
    cues: await prisma.cue.findMany(),
    regressions: await prisma.regression.findMany(),
    progressions: await prisma.progression.findMany(),
    sourceLinks: await prisma.sourceOnEntity.findMany(),
    entityCodes: await prisma.entityCode.findMany(),
    tags: await prisma.tag.findMany(),
    tagLinks: await prisma.tagOnEntity.findMany(),
  };

  const counts = Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, v.length]));
  const manifest = {
    name: "body-iq-dataset",
    version: pkgVersion(),
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    gitSha: gitSha(),
    license: "See repository LICENSE. Source citations are bibliographic identifiers (PMID/DOI), which are facts and free to redistribute.",
    description: "Body IQ biomechanics knowledge graph — regions, joints, movements, muscles, functional tasks, goals, exercises, weighted links, and evidence.",
    keys: "Every record has a globally-unique `id` (cuid) and a per-type `slug`. Key on (type, slug) or on id.",
    counts,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(join(OUT, "body-iq-dataset.json"), JSON.stringify({ manifest, ...collections }, null, 1));

  // SQLite-loadable dump
  let sql = `-- Body IQ dataset ${manifest.version} (schema v${SCHEMA_VERSION}, ${manifest.gitSha})\n-- Load: sqlite3 body-iq.db < body-iq.sql\nPRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n\n`;
  for (const [name, rows] of Object.entries(collections)) sql += toSqlTable(name, rows as Record<string, unknown>[]);
  sql += "COMMIT;\n";
  writeFileSync(join(OUT, "body-iq.sql"), sql);

  // JSON-Schema contract (draft-07) for the bundle shape
  const arrayOf = (required: string[], note: string) => ({
    type: "array",
    description: note,
    items: { type: "object", required, properties: Object.fromEntries(required.map((r) => [r, {}])) },
  });
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://bodyiq.dev/schema/dataset/v1",
    title: "Body IQ dataset bundle",
    type: "object",
    required: ["manifest", "regions", "joints", "movements", "muscles", "exercises", "sources"],
    properties: {
      manifest: { type: "object", required: ["name", "version", "schemaVersion", "generatedAt", "counts"] },
      regions: arrayOf(["id", "slug", "name"], "Anatomical regions."),
      joints: arrayOf(["id", "slug", "name", "regionId"], "Joints, each belonging to a region."),
      movements: arrayOf(["id", "slug", "name", "jointId"], "Joint motions; aromMin/aromMax carry ROM in romUnit."),
      muscles: arrayOf(["id", "slug", "name", "origin", "insertion", "action", "innervation"], "Muscles with full attachment anatomy."),
      functionalTasks: arrayOf(["id", "slug", "name"], "Everyday / sport tasks."),
      goals: arrayOf(["id", "slug", "name", "goalType"], "Rehab / performance / prevention / mobility goals."),
      exercises: arrayOf(["id", "slug", "name"], "Exercises with dosing, cues, positions, qualityScore, validation."),
      gaitPhases: arrayOf(["id"], "Rancho Los Amigos gait phases."),
      sources: arrayOf(["id", "slug", "title"], "Research sources; pmid/doi are stable identifiers."),
      movementMuscles: arrayOf(["movementId", "muscleId", "role"], "Weighted movement↔muscle links (role = primary/secondary/...)."),
      exerciseMuscles: arrayOf(["exerciseId", "muscleId", "role"], "Weighted exercise↔muscle links (role incl. 'lengthening' for stretch)."),
      exerciseMovements: arrayOf(["exerciseId", "movementId"], "Exercise↔movement links."),
      exerciseFunctionalTasks: arrayOf(["exerciseId", "functionalTaskId"], "Exercise↔task links (relevance essential/supportive)."),
      movementFunctionalTasks: arrayOf(["movementId", "functionalTaskId"], "Movement↔task links."),
      exerciseGoals: arrayOf(["exerciseId", "goalId"], "Exercise↔goal links (relevance + caution)."),
      exerciseGaitPhases: arrayOf(["exerciseId", "gaitPhaseId"], "Exercise↔gait-phase links."),
      cues: arrayOf(["id", "exerciseId", "text"], "Coaching cues."),
      regressions: arrayOf(["id", "exerciseId"], "Easier variations."),
      progressions: arrayOf(["id", "exerciseId"], "Harder variations."),
      sourceLinks: arrayOf(["sourceId", "entityType", "entityId"], "Polymorphic source attachments (any claim → citation)."),
      entityCodes: arrayOf(["id", "system", "code", "entityType"], "Terminology codes (SNOMED CT etc.) on entities."),
      tags: arrayOf(["id", "name"], "Tags."),
      tagLinks: arrayOf(["tagId", "entityType", "entityId"], "Polymorphic tag attachments."),
    },
  };
  writeFileSync(join(OUT, "body-iq-dataset.schema.json"), JSON.stringify(schema, null, 2));

  // README
  const readme = `# Body IQ dataset — v${manifest.version} (schema v${SCHEMA_VERSION})

The full Body IQ biomechanics knowledge graph as a portable artifact. No Postgres required.

Generated ${manifest.generatedAt} from commit \`${manifest.gitSha}\`.

## Files
- \`body-iq-dataset.json\` — the whole graph: per-type entity collections plus weighted link tables.
- \`manifest.json\` — version, schema version, git SHA, and per-collection counts.
- \`body-iq-dataset.schema.json\` — JSON-Schema (draft-07) contract for the bundle shape.
- \`body-iq.sql\` — a SQLite-loadable dump: \`sqlite3 body-iq.db < body-iq.sql\`.

## Shape
Normalized, like a database dump. Entities (\`regions\`, \`joints\`, \`movements\`,
\`muscles\`, \`functionalTasks\`, \`goals\`, \`exercises\`, \`sources\`) carry a
globally-unique \`id\` (cuid) and a per-type \`slug\`. Relationships live in link
collections (\`movementMuscles\`, \`exerciseMuscles\`, …), each row referencing
entity ids. Muscle links carry a \`role\` (primary / secondary / stabilizer /
synergist / lengthening / common_association).

Key on \`(type, slug)\` or on \`id\` — slugs are unique **within** a type, not across types.

## Counts
${Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

## Provenance & trust
Every entity carries validation metadata (\`status\`, \`confidence\`; exercises also
\`qualityScore\` + \`scoreBreakdown\`). Claims trace to \`sources\` via \`sourceLinks\`;
\`sources\` carry \`pmid\` / \`doi\`. ${manifest.license}
`;
  writeFileSync(join(OUT, "README.md"), readme);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Dataset ${manifest.version} (schema v${SCHEMA_VERSION}, ${manifest.gitSha}) → exports/dataset/`);
  console.log(`  ${Object.keys(collections).length} collections, ${total.toLocaleString()} rows total`);
  console.log(`  JSON + manifest + JSON-Schema + SQLite dump + README`);
}

main().finally(() => prisma.$disconnect());
