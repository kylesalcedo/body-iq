import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks/[slug] — an everyday task with the exercises that build it
export async function GET(_r: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const t = await prisma.functionalTask.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true, name: true, category: true, description: true,
      exercises: { select: { relevance: true, exercise: { select: { slug: true, name: true, category: true, difficulty: true, qualityScore: true } } } },
    },
  });
  if (!t) return NextResponse.json({ error: `Task not found: ${params.slug}` }, { status: 404 });
  const rank = (r: string | null) => (r === "essential" ? 0 : 1);
  const { exercises: raw, ...taskMeta } = t;
  const exercises = raw
    .sort((a, b) => rank(a.relevance) - rank(b.relevance) || (b.exercise.qualityScore ?? 0) - (a.exercise.qualityScore ?? 0))
    .map((x) => ({ ...x.exercise, relevance: x.relevance }));
  return NextResponse.json({ ...taskMeta, exerciseCount: exercises.length, exercises });
}
