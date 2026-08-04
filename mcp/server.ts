#!/usr/bin/env node
/**
 * Body IQ MCP server — dataset-backed.
 *
 * Exposes the biomechanics knowledge graph as MCP tools so any Claude/agent can
 * query it. Reads the exported dataset bundle (no Postgres needed), so it runs
 * anywhere Node does. Every payload carries validation metadata
 * (status / confidence / qualityScore / sources) for trust-aware reasoning.
 *
 * Data source: BODY_IQ_DATASET env, else ../exports/dataset/body-iq-dataset.json
 * (run `pnpm export:dataset` first). Run: pnpm mcp  (or via an MCP client config).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DATASET = process.env.BODY_IQ_DATASET || join(here, "..", "exports", "dataset", "body-iq-dataset.json");
if (!existsSync(DATASET)) {
  console.error(`Body IQ dataset not found at ${DATASET}.\nRun \`pnpm export:dataset\` or set BODY_IQ_DATASET to a body-iq-dataset.json.`);
  process.exit(1);
}
const db: any = JSON.parse(readFileSync(DATASET, "utf8"));

// ── indexes ──
const idxId = (a: any[]) => new Map(a.map((x) => [x.id, x]));
const idxSlug = (a: any[]) => new Map(a.map((x) => [x.slug, x]));
const groupBy = (a: any[], k: (x: any) => string | undefined) => {
  const m = new Map<string, any[]>();
  for (const x of a) { const key = k(x); if (key == null) continue; (m.get(key) ?? m.set(key, []).get(key)!).push(x); }
  return m;
};

const exId = idxId(db.exercises), exSlug = idxSlug(db.exercises);
const musId = idxId(db.muscles), musSlug = idxSlug(db.muscles);
const mvId = idxId(db.movements), mvSlug = idxSlug(db.movements);
const goalId = idxId(db.goals), goalSlug = idxSlug(db.goals);
const taskId = idxId(db.functionalTasks), taskSlug = idxSlug(db.functionalTasks);
const srcId = idxId(db.sources);
const jtId = idxId(db.joints);
const regId = idxId(db.regions);

const exMusByEx = groupBy(db.exerciseMuscles, (x) => x.exerciseId);
const exMusByMus = groupBy(db.exerciseMuscles, (x) => x.muscleId);
const exMvByEx = groupBy(db.exerciseMovements, (x) => x.exerciseId);
const exMvByMv = groupBy(db.exerciseMovements, (x) => x.movementId);
const mvMusByMv = groupBy(db.movementMuscles, (x) => x.movementId);
const mvMusByMus = groupBy(db.movementMuscles, (x) => x.muscleId);
const exGoalByEx = groupBy(db.exerciseGoals, (x) => x.exerciseId);
const exGoalByGoal = groupBy(db.exerciseGoals, (x) => x.goalId);
const exTaskByEx = groupBy(db.exerciseFunctionalTasks, (x) => x.exerciseId);
const exTaskByTask = groupBy(db.exerciseFunctionalTasks, (x) => x.functionalTaskId);
const cuesByEx = groupBy(db.cues, (x) => x.exerciseId);
const regByEx = groupBy(db.regressions, (x) => x.exerciseId);
const progByEx = groupBy(db.progressions, (x) => x.exerciseId);
const srcByEx = groupBy(db.sourceLinks, (x) => x.exerciseId);
const srcByMus = groupBy(db.sourceLinks, (x) => x.muscleId);
const codeByMus = groupBy(db.entityCodes, (x) => x.muscleId);
const codeByJt = groupBy(db.entityCodes, (x) => x.jointId);

// ── shapers ──
const src = (id: string) => { const s = srcId.get(id); return s && { slug: s.slug, title: s.title, authors: s.authors, year: s.year, pmid: s.pmid, doi: s.doi }; };
const muscleRef = (id: string) => { const m = musId.get(id); return m && { slug: m.slug, name: m.name }; };
const movementRef = (id: string) => { const m = mvId.get(id); return m && { slug: m.slug, name: m.name, plane: m.plane, romMax: m.aromMax }; };

function exerciseDetail(ex: any) {
  return {
    slug: ex.slug, name: ex.name, description: ex.description, category: ex.category, difficulty: ex.difficulty,
    startPosition: ex.startPosition, endPosition: ex.endPosition, rom: ex.rom, dosing: ex.dosing,
    evidenceLevel: ex.evidenceLevel, rationale: ex.rationale,
    validation: { status: ex.status, confidence: ex.confidence, qualityScore: ex.qualityScore, provenance: ex.provenance },
    muscles: (exMusByEx.get(ex.id) ?? []).map((l) => ({ ...muscleRef(l.muscleId), role: l.role })).filter((x) => x.slug),
    movements: (exMvByEx.get(ex.id) ?? []).map((l) => movementRef(l.movementId)).filter(Boolean),
    goals: (exGoalByEx.get(ex.id) ?? []).map((l) => { const g = goalId.get(l.goalId); return g && { slug: g.slug, name: g.name, type: g.goalType, relevance: l.relevance, caution: l.caution }; }).filter(Boolean),
    functionalTasks: (exTaskByEx.get(ex.id) ?? []).map((l) => { const t = taskId.get(l.functionalTaskId); return t && { slug: t.slug, name: t.name, relevance: l.relevance }; }).filter(Boolean),
    cues: (cuesByEx.get(ex.id) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c) => ({ text: c.text, focus: c.focus })),
    regressions: (regByEx.get(ex.id) ?? []).map((r) => ({ name: r.name, criterion: r.criterion, targetSlug: r.targetExerciseId ? exId.get(r.targetExerciseId)?.slug ?? null : null })),
    progressions: (progByEx.get(ex.id) ?? []).map((p) => ({ name: p.name, criterion: p.criterion, targetSlug: p.targetExerciseId ? exId.get(p.targetExerciseId)?.slug ?? null : null })),
    sources: (srcByEx.get(ex.id) ?? []).map((l) => src(l.sourceId)).filter(Boolean),
  };
}

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const notFound = (what: string) => ({ isError: true, content: [{ type: "text" as const, text: `Not found: ${what}` }] });

// ── server ──
const server = new McpServer({ name: "body-iq", version: db.manifest?.version ?? "0.0.0" });

server.tool(
  "find_exercises",
  "Find exercises by the muscle they target, a movement, a goal, or a functional task, with optional difficulty / category / trust filters. Returns matches with validation metadata.",
  {
    muscle: z.string().optional().describe("muscle slug the exercise should target"),
    muscleRole: z.enum(["primary", "secondary", "stabilizer", "synergist", "lengthening", "any"]).optional().describe("required role for the muscle match (default: any)"),
    movement: z.string().optional().describe("movement slug the exercise trains"),
    goal: z.string().optional().describe("goal slug (e.g. improve-squat, low-back-pain)"),
    task: z.string().optional().describe("functional-task slug"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    category: z.string().optional(),
    minConfidence: z.number().min(0).max(1).optional(),
    minQualityScore: z.number().min(0).max(100).optional(),
    limit: z.number().int().positive().max(100).optional().describe("default 25"),
  },
  async (a) => {
    let ids: Set<string> | null = null;
    const restrict = (list: string[]) => { const s = new Set(list); ids = ids ? new Set([...ids].filter((x) => s.has(x))) : s; };
    if (a.muscle) {
      const m = musSlug.get(a.muscle); if (!m) return notFound(`muscle ${a.muscle}`);
      restrict((exMusByMus.get(m.id) ?? []).filter((l) => !a.muscleRole || a.muscleRole === "any" || l.role === a.muscleRole).map((l) => l.exerciseId));
    }
    if (a.movement) { const m = mvSlug.get(a.movement); if (!m) return notFound(`movement ${a.movement}`); restrict((exMvByMv.get(m.id) ?? []).map((l) => l.exerciseId)); }
    if (a.goal) { const g = goalSlug.get(a.goal); if (!g) return notFound(`goal ${a.goal}`); restrict((exGoalByGoal.get(g.id) ?? []).map((l) => l.exerciseId)); }
    if (a.task) { const t = taskSlug.get(a.task); if (!t) return notFound(`task ${a.task}`); restrict((exTaskByTask.get(t.id) ?? []).map((l) => l.exerciseId)); }

    let list: any[] = ids ? [...ids].map((id) => exId.get(id)).filter(Boolean) : [...db.exercises];
    if (a.difficulty) list = list.filter((e) => e.difficulty === a.difficulty);
    if (a.category) list = list.filter((e) => e.category === a.category);
    if (a.minConfidence != null) list = list.filter((e) => (e.confidence ?? 0) >= a.minConfidence!);
    if (a.minQualityScore != null) list = list.filter((e) => (e.qualityScore ?? 0) >= a.minQualityScore!);
    list.sort((x, y) => (y.qualityScore ?? 0) - (x.qualityScore ?? 0));
    const out = list.slice(0, a.limit ?? 25).map((e) => ({ slug: e.slug, name: e.name, category: e.category, difficulty: e.difficulty, qualityScore: e.qualityScore, status: e.status, confidence: e.confidence }));
    return ok({ count: list.length, returned: out.length, exercises: out });
  },
);

server.tool(
  "get_exercise",
  "Full record for one exercise: muscles by role, movements, cues, dosing, positions, progressions/regressions, goals, functional tasks, and the source citations — the complete evidence chain.",
  { slug: z.string().describe("exercise slug") },
  async (a) => { const e = exSlug.get(a.slug); return e ? ok(exerciseDetail(e)) : notFound(`exercise ${a.slug}`); },
);

server.tool(
  "get_muscle",
  "A muscle's full attachment anatomy (origin/insertion/action/innervation/blood supply), the movements and exercises it drives (by role), terminology codes, and sources.",
  { slug: z.string().describe("muscle slug") },
  async (a) => {
    const m = musSlug.get(a.slug); if (!m) return notFound(`muscle ${a.slug}`);
    return ok({
      slug: m.slug, name: m.name, origin: m.origin, insertion: m.insertion, action: m.action, innervation: m.innervation, bloodSupply: m.bloodSupply,
      validation: { status: m.status, confidence: m.confidence },
      movements: (mvMusByMus.get(m.id) ?? []).map((l) => ({ ...movementRef(l.movementId), role: l.role })).filter((x) => x.slug),
      exercises: (exMusByMus.get(m.id) ?? []).map((l) => { const e = exId.get(l.exerciseId); return e && { slug: e.slug, name: e.name, role: l.role }; }).filter(Boolean),
      codes: (codeByMus.get(m.id) ?? []).map((c) => ({ system: c.system, code: c.code, display: c.display })),
      sources: (srcByMus.get(m.id) ?? []).map((l) => src(l.sourceId)).filter(Boolean),
    });
  },
);

server.tool(
  "get_movement",
  "A joint movement: its plane, normal range of motion (ROM), the muscles that produce it (by role), and the exercises that train it.",
  { slug: z.string().describe("movement slug") },
  async (a) => {
    const m = mvSlug.get(a.slug); if (!m) return notFound(`movement ${a.slug}`);
    const jt = m.jointId ? jtId.get(m.jointId) : null;
    return ok({
      slug: m.slug, name: m.name, plane: m.plane, axis: m.axis,
      rom: { aromMin: m.aromMin, aromMax: m.aromMax, unit: m.romUnit, source: m.romSource, notes: m.romNotes },
      joint: jt && { slug: jt.slug, name: jt.name },
      validation: { status: m.status, confidence: m.confidence },
      muscles: (mvMusByMv.get(m.id) ?? []).map((l) => ({ ...muscleRef(l.muscleId), role: l.role })).filter((x) => x.slug),
      exercises: (exMvByMv.get(m.id) ?? []).map((l) => { const e = exId.get(l.exerciseId); return e && { slug: e.slug, name: e.name }; }).filter(Boolean),
    });
  },
);

server.tool(
  "find_by_goal",
  "Exercises for a rehab / performance / prevention / mobility goal, ranked essential-first, with any safety cautions.",
  { goal: z.string().describe("goal slug, e.g. improve-squat or low-back-pain"), limit: z.number().int().positive().max(100).optional() },
  async (a) => {
    const g = goalSlug.get(a.goal); if (!g) return notFound(`goal ${a.goal}`);
    const rank = (r: string) => (r === "essential" ? 0 : 1);
    const rows = (exGoalByGoal.get(g.id) ?? [])
      .map((l) => ({ e: exId.get(l.exerciseId), relevance: l.relevance, caution: l.caution }))
      .filter((x) => x.e)
      .sort((x, y) => rank(x.relevance) - rank(y.relevance) || (y.e.qualityScore ?? 0) - (x.e.qualityScore ?? 0))
      .slice(0, a.limit ?? 50)
      .map((x) => ({ slug: x.e.slug, name: x.e.name, relevance: x.relevance, caution: x.caution, qualityScore: x.e.qualityScore }));
    return ok({ goal: { slug: g.slug, name: g.name, type: g.goalType, description: g.description }, count: rows.length, exercises: rows });
  },
);

server.tool(
  "search",
  "Text search across the graph (exercises, muscles, movements, goals, functional tasks). Returns matches with their type and slug.",
  { query: z.string().min(2).describe("search text"), type: z.enum(["exercise", "muscle", "movement", "goal", "task", "any"]).optional(), limit: z.number().int().positive().max(50).optional() },
  async (a) => {
    const q = a.query.toLowerCase();
    const hit = (name: string, slug: string) => name.toLowerCase().includes(q) || slug.toLowerCase().includes(q);
    const out: any[] = [];
    const scan = (arr: any[], type: string) => { if (a.type && a.type !== "any" && a.type !== type) return; for (const x of arr) if (hit(x.name, x.slug)) out.push({ type, slug: x.slug, name: x.name }); };
    scan(db.exercises, "exercise"); scan(db.muscles, "muscle"); scan(db.movements, "movement"); scan(db.goals, "goal"); scan(db.functionalTasks, "task");
    return ok({ count: out.length, results: out.slice(0, a.limit ?? 25) });
  },
);

server.tool(
  "dataset_info",
  "Dataset manifest — version, schema version, git SHA, and per-collection counts.",
  {},
  async () => ok(db.manifest),
);

await server.connect(new StdioServerTransport());
console.error(`Body IQ MCP server ready — dataset ${db.manifest?.version} (${db.manifest?.gitSha}), ${db.exercises.length} exercises.`);
