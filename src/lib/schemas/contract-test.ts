/**
 * Body IQ v1 contract test.
 *
 * Invokes each documented v1 route handler against the live (seeded) database
 * and validates the response against the matching Zod schema in
 * src/lib/schemas/api-v1.ts.
 *
 * A red run means the v1 contract has drifted — either a documented field was
 * renamed/removed, an envelope changed shape, or a type flipped. Fix the route
 * (or, if the change is intentional, cut a v2 route and update the doc).
 *
 * Run: pnpm contract:test   (requires DATABASE_URL pointing at a seeded DB)
 */
import { NextRequest } from "next/server";
import { z } from "zod";

import { GET as statsGET } from "@/app/api/stats/route";
import { GET as searchGET } from "@/app/api/search/route";
import { GET as exercisesGET } from "@/app/api/exercises/route";
import { GET as exerciseDetailGET } from "@/app/api/exercises/[slug]/route";
import { GET as filtersGET } from "@/app/api/exercises/filters/route";
import { GET as musclesGET } from "@/app/api/muscles/route";
import { GET as sourcesGET } from "@/app/api/sources/route";

import {
  StatsResponseSchema,
  SearchResponseSchema,
  ExercisesListResponseSchema,
  ExerciseDetailResponseSchema,
  ExerciseNotFoundResponseSchema,
  FiltersResponseSchema,
  MusclesResponseSchema,
  SourcesDefaultResponseSchema,
  SourcesRagResponseSchema,
} from "@/lib/schemas/api-v1";
import { prisma } from "@/lib/prisma";

const BASE = "http://localhost/api";

function req(path: string): NextRequest {
  return new NextRequest(new URL(`${BASE}${path}`));
}

let passed = 0;
let failed = 0;

async function check<T>(
  label: string,
  schema: z.ZodType<T>,
  loader: () => Promise<Response>,
  expectStatus = 200,
) {
  try {
    const res = await loader();
    if (res.status !== expectStatus) {
      throw new Error(`expected status ${expectStatus}, got ${res.status}`);
    }
    const body = await res.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .slice(0, 5)
        .map((i) => `    · ${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n");
      const extra = parsed.error.issues.length > 5 ? `\n    … ${parsed.error.issues.length - 5} more` : "";
      throw new Error(`schema mismatch:\n${issues}${extra}`);
    }
    passed++;
    console.log(`  ✓ ${label}`);
  } catch (e: any) {
    failed++;
    console.error(`  ✗ ${label}: ${e.message}`);
  }
}

async function main() {
  console.log("\nBody IQ v1 contract test\n");

  // Probe for a real exercise slug to exercise endpoint 4.
  const sampleExercise = await prisma.exercise.findFirst({ select: { slug: true } });
  const sampleSlug = sampleExercise?.slug;
  if (!sampleSlug) {
    console.error("✗ Database has no exercises — seed before running the contract test.");
    process.exit(1);
  }

  console.log("Endpoint 1 — GET /api/stats");
  await check("response shape", StatsResponseSchema, () => statsGET());

  console.log("\nEndpoint 2 — GET /api/search");
  await check("empty (no q)", SearchResponseSchema, () => searchGET(req("/search")));
  await check("with matches (q=hip)", SearchResponseSchema, () => searchGET(req("/search?q=hip")));

  console.log("\nEndpoint 3 — GET /api/exercises");
  await check("no filters", ExercisesListResponseSchema, () => exercisesGET(req("/exercises")));
  await check("with filter (region=hip)", ExercisesListResponseSchema, () =>
    exercisesGET(req("/exercises?region=hip")),
  );

  console.log("\nEndpoint 4 — GET /api/exercises/:slug");
  await check(`found (${sampleSlug})`, ExerciseDetailResponseSchema, () =>
    exerciseDetailGET(req(`/exercises/${sampleSlug}`), { params: Promise.resolve({ slug: sampleSlug }) }),
  );
  await check(
    "not found (404)",
    ExerciseNotFoundResponseSchema,
    () =>
      exerciseDetailGET(req("/exercises/__does-not-exist__"), {
        params: Promise.resolve({ slug: "__does-not-exist__" }),
      }),
    404,
  );

  console.log("\nEndpoint 5 — GET /api/exercises/filters");
  await check("response shape", FiltersResponseSchema, () => filtersGET());

  console.log("\nEndpoint 6 — GET /api/muscles");
  await check("default", MusclesResponseSchema, () => musclesGET(req("/muscles")));
  await check("with q + paging", MusclesResponseSchema, () =>
    musclesGET(req("/muscles?q=glute&limit=5&offset=0")),
  );

  console.log("\nEndpoint 7 — GET /api/sources");
  await check("default format", SourcesDefaultResponseSchema, () => sourcesGET(req("/sources")));
  await check("filter=fulltext", SourcesDefaultResponseSchema, () =>
    sourcesGET(req("/sources?filter=fulltext")),
  );
  await check("format=rag", SourcesRagResponseSchema, () => sourcesGET(req("/sources?format=rag")));

  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
