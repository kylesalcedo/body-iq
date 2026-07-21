/**
 * FHIR R4 mapping — single source of truth for turning an exercise (with the
 * `fhirInclude` relations loaded) into a FHIR `ActivityDefinition` resource.
 * Used by both the batch export (scripts/export-fhir.ts) and the live API route
 * (/api/exercises/[slug]/fhir) so the file export and the on-screen view never
 * drift apart.
 */
import type { Prisma } from "@prisma/client";

export const INTERNAL_SYSTEM = "https://bodyiq.dev/fhir/CodeSystem/exercise";
const BASE = "https://bodyiq.dev/fhir";

// The relations buildActivityDefinition needs. Import this into any query.
export const fhirInclude = {
  codes: true,
  muscles: { include: { muscle: { select: { slug: true, name: true, codes: true } } } },
  movements: { include: { movement: { select: { name: true, joint: { select: { codes: true, region: { select: { slug: true, name: true } } } } } } } },
  cues: { orderBy: { order: "asc" } },
  regressions: { include: { targetExercise: { select: { slug: true, name: true } } } },
  progressions: { include: { targetExercise: { select: { slug: true, name: true } } } },
  sources: { include: { source: { select: { slug: true, title: true, authors: true, year: true, journal: true, doi: true, pmid: true } } } },
} satisfies Prisma.ExerciseInclude;

const STATUS_MAP: Record<string, "draft" | "active" | "retired" | "unknown"> = {
  draft: "draft", needs_review: "draft", reviewed: "active", verified: "active", disputed: "retired",
};

function pascal(slug: string): string {
  return slug.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

// `ex` is an Exercise loaded with fhirInclude. Typed loosely to avoid coupling
// the mapping to one generated payload shape.
export function buildActivityDefinition(ex: any): Record<string, unknown> {
  // bodySite by region; collect any SNOMED joint codes reached, to enrich the coding.
  const regionMap = new Map<string, string>();
  const regionJointCodes = new Map<string, { system: string; code: string; display?: string }[]>();
  for (const m of ex.movements) {
    const joint = m.movement.joint;
    const r = joint?.region;
    if (!r) continue;
    regionMap.set(r.slug, r.name);
    for (const c of joint.codes ?? []) {
      const arr = regionJointCodes.get(r.slug) ?? [];
      if (!arr.some((x) => x.system === c.system && x.code === c.code)) {
        arr.push({ system: c.system, code: c.code, ...(c.display ? { display: c.display } : {}) });
      }
      regionJointCodes.set(r.slug, arr);
    }
  }

  const topic = ex.codes.length > 0
    ? ex.codes.map((c: any) => ({ coding: [{ system: c.system, code: c.code, ...(c.display ? { display: c.display } : {}) }] }))
    : [{ coding: [{ system: INTERNAL_SYSTEM, code: ex.slug, display: ex.name }] }];

  const relatedArtifact: unknown[] = [];
  for (const s of ex.sources) {
    const src = s.source;
    const citation = [src.authors, src.year ? `(${src.year})` : null, src.title, src.journal].filter(Boolean).join(". ");
    relatedArtifact.push({ type: "citation", label: src.slug, citation, ...(src.doi ? { document: { url: `https://doi.org/${src.doi}` } } : {}) });
  }
  for (const pr of ex.progressions) {
    if (pr.targetExercise) relatedArtifact.push({ type: "successor", label: pr.criterion || "progression", display: pr.targetExercise.name, resource: `ActivityDefinition/${pr.targetExercise.slug}` });
  }
  for (const rg of ex.regressions) {
    if (rg.targetExercise) relatedArtifact.push({ type: "predecessor", label: rg.criterion || "regression", display: rg.targetExercise.name, resource: `ActivityDefinition/${rg.targetExercise.slug}` });
  }

  const muscleExtension = ex.muscles.map((em: any) => ({
    url: `${BASE}/StructureDefinition/muscle-involvement`,
    extension: [
      { url: "muscle", valueString: em.muscle.name },
      { url: "role", valueCode: em.role },
      ...(em.muscle.codes?.[0] ? [{ url: "coding", valueCoding: { system: em.muscle.codes[0].system, code: em.muscle.codes[0].code } }] : []),
    ],
  }));

  return {
    resourceType: "ActivityDefinition",
    id: ex.slug,
    url: `${BASE}/ActivityDefinition/${ex.slug}`,
    version: "1",
    name: pascal(ex.slug),
    title: ex.name,
    status: STATUS_MAP[ex.status] ?? "unknown",
    experimental: ex.status !== "verified",
    description: ex.description,
    ...(ex.difficulty ? { useContext: [{ code: { system: "http://terminology.hl7.org/CodeSystem/usage-context-type", code: "user" }, valueCodeableConcept: { text: `difficulty: ${ex.difficulty}` } }] } : {}),
    topic,
    ...(regionMap.size ? { bodySite: [...regionMap].map(([slug, name]) => ({ coding: [{ system: INTERNAL_SYSTEM, code: slug, display: name }, ...(regionJointCodes.get(slug) ?? [])], text: name })) } : {}),
    kind: "ServiceRequest",
    ...(ex.dosing ? { dosage: [{ text: ex.dosing }] } : {}),
    ...(ex.emgNotes || ex.evidenceLevel ? { usage: [ex.evidenceLevel ? `Evidence: ${ex.evidenceLevel}.` : "", ex.emgNotes || ""].filter(Boolean).join(" ") } : {}),
    ...(ex.cues.length ? { note: ex.cues.map((c: any) => ({ text: c.text, ...(c.focus ? { authorString: `focus:${c.focus}` } : {}) })) } : {}),
    ...(relatedArtifact.length ? { relatedArtifact } : {}),
    ...(muscleExtension.length ? { extension: muscleExtension } : {}),
  };
}
