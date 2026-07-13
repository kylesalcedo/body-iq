import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";

/**
 * Published normal range-of-motion reference values for movements — AROM/PROM
 * min/max in degrees with the reference source (AAOS / Norkin & White), filled
 * only where empty. Non-goniometric motions (scapular translations, thumb
 * opposition, isolated upper-cervical) keep null angular values with a romNotes
 * explanation. Foundational educational data ("what is normal knee flexion?").
 */

const FILE = join(__dirname, "movement-rom-2026-07.json");

export async function seedMovementRomExtension() {
  logSection("Movement ROM reference values");
  if (!existsSync(FILE)) { console.log("    (no ROM JSON — skipping)"); return; }

  const items: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  let n = 0;
  for (const it of items) {
    const mv = await prisma.movement.findUnique({ where: { slug: it.slug }, select: { id: true, aromMax: true, romSource: true } });
    if (!mv) continue;
    if (mv.aromMax != null || mv.romSource) continue; // already has ROM data
    await prisma.movement.update({
      where: { id: mv.id },
      data: {
        aromMin: it.aromMin ?? null,
        aromMax: it.aromMax ?? null,
        promMin: it.promMin ?? null,
        promMax: it.promMax ?? null,
        romUnit: it.romUnit ?? "degrees",
        romNotes: it.romNotes ?? null,
        romSource: it.romSource ?? null,
      },
    });
    n++;
  }
  logCount("movements given ROM reference values", n);
}
