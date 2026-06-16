#!/usr/bin/env tsx
/**
 * Knowledge-graph data pipeline orchestrator.
 *
 * Chains the automatable steps of the evidence → database loop and stops at the
 * one step that still needs a human (or a future browser driver): running the
 * generated prompts through the clinical evidence tool.
 *
 *   [1] refresh prompts   prompts:gaps + cue:prompts        (automated)
 *   [2] EVIDENCE FETCH    paste prompts → save responses    (MANUAL — the seam)
 *   [3] import + apply    cues:import + db:seed             (automated)
 *   [4] verify            cue:audit + data:quality          (automated)
 *   [5] publish           git commit/push (committed data)  (automated, opt-in)
 *
 * Behavior: always runs [1]. Then looks for cue-batch prompts that have no
 * saved response yet. If any are pending it prints them and STOPS before [3]
 * (the semi-auto checkpoint) — this is the only thing blocking a fully
 * unattended cron. If no batches are pending, it runs [3]+[4], and [5] when
 * --commit/--push are passed.
 *
 * Usage:
 *   pnpm pipeline                 # refresh prompts, report the fetch seam or import
 *   pnpm pipeline --commit        # also commit regenerated committed data
 *   pnpm pipeline --commit --push # ...and push to origin
 *   pnpm pipeline --skip-prompts  # skip step 1 (e.g. right after a manual fetch)
 */

import { execSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const args = new Set(process.argv.slice(2));
const COMMIT = args.has("--commit");
const PUSH = args.has("--push");
const SKIP_PROMPTS = args.has("--skip-prompts");
const FORCE_IMPORT = args.has("--force-import");

const PROMPTS_DIR = join(process.cwd(), "prompts");
const RESEARCH_DIR = join(process.cwd(), "research");

function run(label: string, cmd: string) {
  console.log(`\n\x1b[1m▶ ${label}\x1b[0m  (${cmd})`);
  execSync(cmd, { stdio: "inherit" });
}

/** Cue-batch prompts that have no matching saved response yet. */
function pendingCueBatches(): string[] {
  let prompts: string[] = [];
  try {
    prompts = readdirSync(PROMPTS_DIR).filter((f) =>
      /^cues-batch-.*\.md$/.test(f),
    );
  } catch {
    return [];
  }
  return prompts.filter(
    (f) => !existsSync(join(RESEARCH_DIR, `${basename(f, ".md")}-response.md`)),
  );
}

/** Gap prompts (auto-*.md) without a response — informational only; these feed
 *  manual seed authoring, not the automated cue importer. */
function pendingGapPrompts(): string[] {
  try {
    return readdirSync(PROMPTS_DIR)
      .filter((f) => /^auto-.*\.md$/.test(f))
      .filter(
        (f) =>
          !existsSync(join(RESEARCH_DIR, `${basename(f, ".md")}-response.md`)),
      );
  } catch {
    return [];
  }
}

function main() {
  console.log("🔧 Body IQ data pipeline\n");

  // ─── [1] Refresh prompts ───────────────────────────────────────────────────
  if (!SKIP_PROMPTS) {
    run("Scan gaps & emit prompts", "pnpm -s prompts:gaps");
    run("Emit cue-rewrite prompts", "pnpm -s cue:prompts");
  } else {
    console.log("⏭  Skipping prompt refresh (--skip-prompts)");
  }

  // ─── [2] Evidence-fetch seam ───────────────────────────────────────────────
  const pendingCues = pendingCueBatches();
  const pendingGaps = pendingGapPrompts();

  if (pendingGaps.length) {
    console.log(
      `\nℹ ${pendingGaps.length} gap prompt(s) await manual authoring (not auto-imported):`,
    );
    for (const f of pendingGaps) console.log(`   - prompts/${f}`);
  }

  if (pendingCues.length && !FORCE_IMPORT) {
    console.log(
      `\n\x1b[33m⏸  EVIDENCE FETCH NEEDED — ${pendingCues.length} cue batch(es) have no response yet:\x1b[0m`,
    );
    for (const f of pendingCues) console.log(`   - prompts/${f}`);
    console.log(
      `\nRun each through the evidence tool, save to research/<name>-response.md,\n` +
        `then re-run \`pnpm pipeline --skip-prompts\` to import & apply.\n` +
        `(This is the only step a cron can't do yet — it needs the browser driver.)`,
    );
    console.log("\n✋ Stopping before import (nothing to apply yet).");
    return;
  }

  // ─── [3] Import + apply ────────────────────────────────────────────────────
  run("Import cue rewrites", "pnpm -s cues:import");
  run("Seed database", "pnpm -s db:seed");

  // ─── [4] Verify ────────────────────────────────────────────────────────────
  run("Audit cues", "pnpm -s cue:audit");
  run("Data-quality check", "pnpm -s data:quality");

  // ─── [5] Publish (opt-in) ──────────────────────────────────────────────────
  if (COMMIT) {
    // Only the committed, generated artifacts — never prompts/ or research/.
    run(
      "Stage generated data",
      "git add prisma/seed/extensions/cue-rewrites.ts prisma/schema.prisma",
    );
    const hasChanges =
      execSync("git status --porcelain --untracked-files=no").toString().trim()
        .length > 0;
    if (!hasChanges) {
      console.log("\n✓ No data changes to commit.");
    } else {
      run(
        "Commit",
        `git commit -m "chore(data): refresh cue rewrites via pipeline"`,
      );
      if (PUSH) run("Push", "git push origin HEAD");
    }
  }

  console.log("\n✅ Pipeline complete.");
}

main();
