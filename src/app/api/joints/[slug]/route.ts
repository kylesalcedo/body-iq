import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/joints/[slug] — a joint with its region, movements (and their ROM),
// and terminology codes.
export async function GET(_r: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const j = await prisma.joint.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true, name: true, jointType: true, status: true, confidence: true,
      region: { select: { slug: true, name: true } },
      codes: { select: { system: true, code: true, display: true, status: true } },
      movements: {
        orderBy: { name: "asc" },
        select: { slug: true, name: true, plane: true, aromMin: true, aromMax: true, romUnit: true, _count: { select: { muscles: true, exercises: true } } },
      },
      sources: { select: { source: { select: { slug: true, title: true, authors: true, year: true, pmid: true, doi: true } } } },
    },
  });
  if (!j) return NextResponse.json({ error: `Joint not found: ${params.slug}` }, { status: 404 });
  const { movements, sources, ...rest } = j;
  return NextResponse.json({
    ...rest,
    movements: movements.map((m) => ({ slug: m.slug, name: m.name, plane: m.plane, aromMin: m.aromMin, aromMax: m.aromMax, romUnit: m.romUnit, muscleCount: m._count.muscles, exerciseCount: m._count.exercises })),
    sources: sources.map((x) => x.source),
  });
}
