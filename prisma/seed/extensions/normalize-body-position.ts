import { prisma, logSection, logCount } from "../client";

/**
 * Normalize Exercise.bodyPosition to a controlled vocabulary so downstream
 * consumers (a Positions app, filters, FHIR) get clean categories instead of
 * 30+ free-text variants. The detailed narrative already lives in startPosition,
 * so bodyPosition is safely reduced to its canonical category.
 *
 * Canonical set: supine, prone, seated, standing, sidelying, quadruped,
 * kneeling, half-kneeling, hanging.
 *
 * Method: pick the canonical category whose keyword appears EARLIEST in the
 * (lowercased) value — the leading/primary position wins for compound strings
 * like "standing, transitioning through ... prone plank".
 */

const CANON = "supine|prone|seated|standing|sidelying|quadruped|kneeling|half-kneeling|hanging";

// keyword → canonical (checked as earliest-occurrence, half-kneeling before kneeling)
const KEYWORDS: [RegExp, string][] = [
  [/hang|suspended/, "hanging"],
  [/supine/, "supine"],
  [/prone|plank/, "prone"],
  [/quadruped/, "quadruped"],
  [/half-kneeling/, "half-kneeling"],
  [/kneeling/, "kneeling"],
  [/side-?lying/, "sidelying"],
  [/seated|sitting|\bsit\b/, "seated"],
  [/standing|upright|\bstand\b/, "standing"],
];

function canonical(raw: string): string | null {
  const s = raw.toLowerCase();
  let best: { idx: number; cat: string } | null = null;
  for (const [re, cat] of KEYWORDS) {
    const m = s.match(re);
    if (m && m.index != null && (best === null || m.index < best.idx)) {
      // half-kneeling special case: if "half-kneeling" and "kneeling" both match at
      // overlapping spots, prefer half-kneeling (more specific) — handled by its
      // earlier position in the raw string usually; enforce here.
      best = { idx: m.index, cat };
    }
  }
  if (best && best.cat === "kneeling" && /half-kneeling/.test(s)) best.cat = "half-kneeling";
  return best ? best.cat : null;
}

export async function seedNormalizeBodyPositionExtension() {
  logSection("Normalize bodyPosition");
  const canonSet = new Set(CANON.split("|"));
  const exs = await prisma.exercise.findMany({ select: { id: true, bodyPosition: true } });
  let changed = 0, unmapped = 0;
  for (const e of exs) {
    if (!e.bodyPosition) continue;
    if (canonSet.has(e.bodyPosition)) continue; // already clean
    const cat = canonical(e.bodyPosition);
    if (!cat) { unmapped++; continue; }
    await prisma.exercise.update({ where: { id: e.id }, data: { bodyPosition: cat } });
    changed++;
  }
  logCount("bodyPosition values normalized", changed);
  if (unmapped) console.log(`    (${unmapped} could not be mapped — left as-is)`);
}
