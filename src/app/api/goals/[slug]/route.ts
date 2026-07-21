import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/goals/[slug] — a goal with its exercises, ranked essential-first.
// The core "give me exercises for X" endpoint.
export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const goal = await prisma.goal.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true, name: true, goalType: true, region: true, description: true,
      exercises: {
        select: {
          relevance: true, caution: true,
          exercise: { select: { slug: true, name: true, category: true, difficulty: true, qualityScore: true, bodyPosition: true } },
        },
      },
    },
  });
  if (!goal) return NextResponse.json({ error: `Goal not found: ${params.slug}` }, { status: 404 });

  const rank = (r: string | null) => (r === "essential" ? 0 : 1);
  const { exercises: raw, ...goalMeta } = goal;
  const exercises = raw
    .sort((a, b) => rank(a.relevance) - rank(b.relevance) || (b.exercise.qualityScore ?? 0) - (a.exercise.qualityScore ?? 0))
    .map((eg) => ({ ...eg.exercise, relevance: eg.relevance, caution: eg.caution }));

  return NextResponse.json({ ...goalMeta, exerciseCount: exercises.length, exercises });
}
