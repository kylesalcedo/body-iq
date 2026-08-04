import { prisma, logSection, logCount } from "../client";

/**
 * Integrity fixes surfaced by `pnpm data:quality` (2026-08):
 *  1. Prime movers for the 5 orphan movements (pelvic tilts, cervical
 *     protraction/retraction) so no movement is left with zero muscle links.
 *  2. Range-of-motion for movements that have a real, sourced degree value.
 *     Peripheral joints use AAOS / Norkin & White; spinal-region values are
 *     marked as segmental/regional estimates (honest — AAOS standardises the
 *     thoracolumbar region combined, not thoracic-only).
 *
 * The "dip" exercise↔joint slug collision is fixed at the data source (the
 * exercise slug is now `parallel-bar-dip`), not here.
 */

type Role = "primary" | "secondary" | "stabilizer" | "synergist" | "lengthening" | "common_association";

const ORPHAN_MOVERS: Record<string, [string, Role][]> = {
  "cervical-protraction": [["sternocleidomastoid", "primary"], ["suboccipitals", "secondary"], ["scalenes", "secondary"]],
  "cervical-retraction": [["deep-cervical-flexors", "primary"], ["semispinalis-cervicis", "secondary"]],
  "anterior-pelvic-tilt": [["iliopsoas", "primary"], ["erector-spinae", "primary"], ["rectus-femoris", "secondary"]],
  "posterior-pelvic-tilt": [["rectus-abdominis", "primary"], ["gluteus-maximus", "primary"], ["hamstrings", "secondary"], ["external-oblique", "secondary"]],
  "lateral-pelvic-tilt": [["quadratus-lumborum", "primary"], ["gluteus-medius", "secondary"], ["external-oblique", "secondary"]],
};

const ROM: Record<string, { min: number; max: number; source: string; notes: string }> = {
  "knee-internal-rotation": { min: 0, max: 10, source: "AAOS / Norkin & White", notes: "Measured with the knee flexed to 90°." },
  "knee-external-rotation": { min: 0, max: 40, source: "AAOS / Norkin & White", notes: "Measured with the knee flexed to 90°." },
  "finger-abduction": { min: 0, max: 25, source: "AAOS", notes: "MCP abduction from the middle-finger reference axis." },
  "cervical-flexion-upper": { min: 0, max: 10, source: "Segmental estimate (occipito-atlantal)", notes: "Upper-cervical nodding contribution; segmental estimate." },
  "cervical-extension-upper": { min: 0, max: 20, source: "Segmental estimate (occipito-atlantal)", notes: "Upper-cervical extension; segmental estimate." },
  "cervical-rotation-upper": { min: 0, max: 45, source: "Segmental estimate (atlantoaxial)", notes: "Atlantoaxial joint supplies roughly half of total cervical rotation." },
  "thoracic-flexion": { min: 0, max: 40, source: "Regional estimate", notes: "Thoracic-region contribution; AAOS standardises the thoracolumbar region combined." },
  "thoracic-extension": { min: 0, max: 25, source: "Regional estimate", notes: "Thoracic-region contribution; AAOS standardises the thoracolumbar region combined." },
  "thoracic-lateral-flexion": { min: 0, max: 25, source: "Regional estimate", notes: "Thoracic-region contribution; AAOS standardises the thoracolumbar region combined." },
};

export async function seedDataIntegrityExtension() {
  logSection("Data-integrity fixes (orphan movers + ROM)");

  // Remove the stale "dip" exercise from earlier seeds (its slug collided with
  // the distal-interphalangeal joint; it is now "parallel-bar-dip"). No-op on a
  // fresh seed, where the exercise is only ever created as parallel-bar-dip.
  const stale = await prisma.exercise.deleteMany({ where: { slug: "dip" } });
  if (stale.count) console.log(`    removed stale "dip" exercise (slug collision)`);

  const muscleId = new Map((await prisma.muscle.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));
  const movementId = new Map((await prisma.movement.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));

  let links = 0, missing = 0;
  for (const [mvSlug, movers] of Object.entries(ORPHAN_MOVERS)) {
    const mvId = movementId.get(mvSlug);
    if (!mvId) { missing++; continue; }
    for (const [musSlug, role] of movers) {
      const musId = muscleId.get(musSlug);
      if (!musId) { missing++; continue; }
      await prisma.movementMuscle.upsert({
        where: { movementId_muscleId: { movementId: mvId, muscleId: musId } },
        update: { role },
        create: { movementId: mvId, muscleId: musId, role, notes: "Prime-mover mapping (data-integrity pass)." },
      });
      links++;
    }
  }
  logCount("orphan-movement muscle links", links);

  let rom = 0;
  for (const [mvSlug, v] of Object.entries(ROM)) {
    const mvId = movementId.get(mvSlug);
    if (!mvId) { missing++; continue; }
    await prisma.movement.update({
      where: { id: mvId },
      data: { aromMin: v.min, aromMax: v.max, romUnit: "degrees", romSource: v.source, romNotes: v.notes },
    });
    rom++;
  }
  logCount("movements given ROM", rom);
  if (missing) console.log(`    (${missing} slugs not found — skipped)`);
}
