#!/usr/bin/env tsx
/**
 * Export each exercise as a FHIR R4 `ActivityDefinition` resource — the standard
 * way to represent a prescribable activity in a clinical system. This makes the
 * library portable into any FHIR-capable EHR / care-plan engine and is what lets
 * a company own an interoperable exercise catalog rather than a bespoke table.
 *
 * Mapping choices:
 *   - id / url            ← slug (stable business identifier)
 *   - name / title        ← slug (PascalCase) / name
 *   - status              ← EntityStatus → FHIR publication-status
 *   - topic[]             ← EntityCode rows (SNOMED etc.) when present, else internal slug coding
 *   - bodySite            ← regions reached (via movement → joint → region)
 *   - dynamicValue/dosage ← `dosing` string (kept as text; UCUM-structured dosing is future work)
 *   - relatedArtifact[]   ← research sources (citation) + progression/regression edges (depends-on)
 *   - useContext          ← difficulty
 *
 * Everything degrades gracefully: an exercise with no codes still emits a valid
 * resource using the internal code system as a placeholder.
 *
 * Usage: tsx scripts/export-fhir.ts [outDir]   (default exports/fhir)
 */
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildActivityDefinition, fhirInclude } from "../src/lib/fhir";

const OUT = process.argv[2] || join(process.cwd(), "exports", "fhir");
const p = new PrismaClient();

async function main() {
  mkdirSync(OUT, { recursive: true });

  const exercises = await p.exercise.findMany({ orderBy: { slug: "asc" }, include: fhirInclude });
  const bundleEntries: unknown[] = [];

  for (const ex of exercises) {
    const resource = buildActivityDefinition(ex);
    writeFileSync(join(OUT, `${ex.slug}.json`), JSON.stringify(resource, null, 2));
    bundleEntries.push({ resource, request: { method: "PUT", url: `ActivityDefinition/${ex.slug}` } });
  }

  // Also emit a transaction Bundle for one-shot POST into a FHIR server
  const bundle = { resourceType: "Bundle", type: "transaction", entry: bundleEntries };
  writeFileSync(join(OUT, "_bundle.json"), JSON.stringify(bundle, null, 2));

  const coded = exercises.filter((e) => e.codes.length > 0).length;
  console.log(`FHIR export: ${exercises.length} ActivityDefinitions → ${OUT}`);
  console.log(`  ${coded}/${exercises.length} carry external codings; the rest use the internal placeholder system.`);
  console.log(`  _bundle.json is a transaction Bundle ready to POST to a FHIR R4 server.`);
}

main().finally(() => p.$disconnect());
