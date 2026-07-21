import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/movements/[slug] — movement with ROM, muscles (by role), and exercises
export async function GET(_r: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const m = await prisma.movement.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true, name: true, plane: true, axis: true,
      aromMin: true, aromMax: true, promMin: true, promMax: true, romUnit: true, romSource: true, romNotes: true,
      joint: { select: { slug: true, name: true, region: { select: { slug: true, name: true } } } },
      muscles: { select: { role: true, muscle: { select: { slug: true, name: true } } } },
      exercises: { select: { exercise: { select: { slug: true, name: true, category: true } } } },
    },
  });
  if (!m) return NextResponse.json({ error: `Movement not found: ${params.slug}` }, { status: 404 });
  return NextResponse.json({
    ...m,
    muscles: m.muscles.map((x) => ({ ...x.muscle, role: x.role })),
    exercises: m.exercises.map((x) => x.exercise),
  });
}
