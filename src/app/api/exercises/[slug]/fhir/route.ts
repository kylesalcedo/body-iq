import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildActivityDefinition, fhirInclude } from "@/lib/fhir";

// GET /api/exercises/[slug]/fhir — the exercise as a live FHIR R4 ActivityDefinition
export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const exercise = await prisma.exercise.findUnique({
    where: { slug: params.slug },
    include: fhirInclude,
  });
  if (!exercise) {
    return NextResponse.json({ error: `Exercise not found: ${params.slug}` }, { status: 404 });
  }
  const resource = buildActivityDefinition(exercise);
  return NextResponse.json(resource, {
    headers: { "Content-Type": "application/fhir+json" },
  });
}
