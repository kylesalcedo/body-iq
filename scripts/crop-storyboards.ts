#!/usr/bin/env tsx
/**
 * Split stacked-panel storyboard images into individual frames for Higgsfield's
 * first/last-frame upload. Removes the manual crop step in the video flow.
 *
 * GPT Image 2 stacks panels evenly (2 for most exercises, 3 for cat-cow). We
 * split into equal bands but TRIM a margin at each shared edge so a frame never
 * catches a sliver of the neighbouring panel's figure (which would confuse the
 * animator). Figures sit centered in their panel with white margin, so trimming
 * the inner edge is safe.
 *
 *   <slug>.png (2 panels) → <slug>-frame1.png (top), <slug>-frame2.png (bottom)
 *   cat-cow  (3 panels)   → -frame1 / -frame2 / -frame3
 *
 * Dead-bug is flagged first-frame-only: animating from the start frame alone
 * avoids the limb-duplication that first→last interpolation causes there.
 *
 * Uses ffmpeg (precise crop=w:h:x:y; sips --cropOffset is unreliable).
 * Usage: tsx scripts/crop-storyboards.ts <storyboardDir> <outDir>
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [srcDir, outDir] = process.argv.slice(2);
if (!srcDir || !outDir) throw new Error("usage: crop-storyboards.ts <storyboardDir> <outDir>");
mkdirSync(outDir, { recursive: true });

const PANELS: Record<string, number> = { "cat-cow": 3 };
const FIRST_FRAME_ONLY = new Set(["dead-bug", "modified-curl-up-dead-bug"]);
const TRIM = 0.06; // fraction of a band trimmed at each shared (inner) edge

function dims(file: string): { w: number; h: number } {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file], { encoding: "utf8" });
  return {
    w: Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]),
    h: Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]),
  };
}

const files = readdirSync(srcDir).filter((f) => /^storyboard-.*\.png$/.test(f));
if (!files.length) { console.log(`no storyboard-*.png in ${srcDir}`); process.exit(0); }

for (const file of files) {
  const slug = file.replace(/^storyboard-/, "").replace(/\.png$/, "");
  const src = join(srcDir, file);
  const { w, h } = dims(src);
  const n = PANELS[slug] || 2;
  const band = h / n;
  const trim = Math.floor(band * TRIM);

  for (let i = 0; i < n; i++) {
    // Trim the top edge for any panel below the first, and the bottom edge for
    // any panel above the last — i.e. trim every edge that abuts a divider.
    const top = Math.round(i * band) + (i > 0 ? trim : 0);
    const bottom = Math.round((i + 1) * band) - (i < n - 1 ? trim : 0);
    const cropH = bottom - top;
    const out = join(outDir, `${slug}-frame${i + 1}.png`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", `crop=${w}:${cropH}:0:${top}`, "-frames:v", "1", out]);
  }
  const note = FIRST_FRAME_ONLY.has(slug) ? "  (use frame1 ONLY — avoids limb duplication)" : "";
  console.log(`${slug}: ${n} frames${note}`);
}

console.log(`\nframes → ${outDir}`);
console.log("Higgsfield: frame1 = first frame, last frameN = last frame.");
