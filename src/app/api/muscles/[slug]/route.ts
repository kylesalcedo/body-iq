import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/muscles/[slug] — a muscle with its full attachment anatomy, the
// movements and exercises it drives (by role), terminology codes, and sources.
export async function GET(_r: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const m = await prisma.muscle.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true, name: true, description: true,
      origin: true, insertion: true, action: true, innervation: true, bloodSupply: true,
      status: true, confidence: true,
      codes: { select: { system: true, code: true, display: true, status: true } },
      movements: { select: { role: true, movement: { select: { slug: true, name: true, joint: { select: { slug: true, name: true } } } } } },
      exercises: { select: { role: true, exercise: { select: { slug: true, name: true } } } },
      sources: { select: { source: { select: { slug: true, title: true, authors: true, year: true, pmid: true, doi: true } } } },
    },
  });
  if (!m) return NextResponse.json({ error: `Muscle not found: ${params.slug}` }, { status: 404 });
  const { movements, exercises, sources, ...rest } = m;
  return NextResponse.json({
    ...rest,
    movements: movements.map((x) => ({ ...x.movement, role: x.role })),
    exercises: exercises.map((x) => ({ ...x.exercise, role: x.role })),
    sources: sources.map((x) => x.source),
  });
}
