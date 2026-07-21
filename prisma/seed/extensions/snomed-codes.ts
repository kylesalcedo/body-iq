import { prisma, logSection, logCount } from "../client";

/**
 * SNOMED CT coding scaffold — seeds a small, curated set of high-confidence
 * body-structure codes for the major synovial joints, as EntityCode rows.
 *
 * IMPORTANT / honesty: these are AI-proposed and seeded with status
 * `needs_review`. Exact SNOMED concept IDs must be verified against a
 * terminology server (UMLS / the SNOMED CT browser) before being treated as
 * authoritative — this file is deliberately NOT a bulk from-memory dump of all
 * 100+ anatomy codes, which would produce plausible-but-wrong IDs. It proves the
 * mechanism end-to-end (EntityCode → FHIR) on a trustworthy sample; comprehensive
 * coverage is a terminology-server job.
 */

const SNOMED = "http://snomed.info/sct";

// jointSlug → { code, display } — major synovial joints only, high confidence.
const JOINT_CODES: Record<string, { code: string; display: string }> = {
  coxofemoral: { code: "24136001", display: "Structure of hip joint" },
  tibiofemoral: { code: "72696002", display: "Structure of knee joint" },
  talocrural: { code: "70258002", display: "Structure of ankle joint" },
  glenohumeral: { code: "42575006", display: "Structure of shoulder joint" },
  radiocarpal: { code: "74670003", display: "Structure of wrist joint" },
  humeroulnar: { code: "16953009", display: "Structure of elbow joint" },
};

export async function seedSnomedCodesExtension() {
  logSection("SNOMED coding scaffold (AI-proposed, needs_review)");

  const joints = await prisma.joint.findMany({ select: { id: true, slug: true } });
  const jointMap = new Map(joints.map((j) => [j.slug, j.id]));

  let n = 0;
  for (const [slug, { code, display }] of Object.entries(JOINT_CODES)) {
    const jointId = jointMap.get(slug);
    if (!jointId) continue; // joint not present — skip silently
    // Idempotent: one code per (joint, system, code).
    const existing = await prisma.entityCode.findFirst({ where: { jointId, system: SNOMED, code } });
    if (existing) continue;
    await prisma.entityCode.create({
      data: {
        system: SNOMED, code, display,
        entityType: "joint", jointId,
        status: "needs_review",
        notes: "AI-proposed SNOMED CT mapping — verify against a terminology server before treating as authoritative.",
      },
    });
    n++;
  }

  logCount("SNOMED joint codes seeded", n);
}
