import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/exercises/[slug] — Get a single exercise with full detail
export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const exercise = await prisma.exercise.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true,
      name: true,
      description: true,
      dosing: true,
      emgNotes: true,
      evidenceLevel: true,
      difficulty: true,
      equipment: true,
      bodyPosition: true,
      imageUrl: true,
      videoUrl: true,
      videoType: true,
      confidence: true,
      status: true,
      notes: true,
      muscles: {
        select: {
          role: true,
          notes: true,
          muscle: {
            select: {
              slug: true,
              name: true,
              origin: true,
              insertion: true,
              action: true,
              innervation: true,
            },
          },
        },
        orderBy: { role: "asc" },
      },
      movements: {
        select: {
          movement: {
            select: {
              slug: true,
              name: true,
              plane: true,
              axis: true,
              joint: {
                select: {
                  slug: true,
                  name: true,
                  region: { select: { slug: true, name: true } },
                },
              },
            },
          },
        },
      },
      functionalTasks: {
        select: {
          functionalTask: {
            select: {
              slug: true,
              name: true,
              description: true,
              category: true,
            },
          },
        },
      },
      cues: {
        select: { text: true, cueType: true },
        orderBy: { order: "asc" },
      },
      regressions: {
        select: { name: true, description: true },
        orderBy: { order: "asc" },
      },
      progressions: {
        select: { name: true, description: true },
        orderBy: { order: "asc" },
      },
      sources: {
        select: {
          notes: true,
          source: {
            select: {
              slug: true,
              title: true,
              authors: true,
              year: true,
              journal: true,
              doi: true,
              sourceType: true,
            },
          },
        },
      },
    },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  return NextResponse.json({ data: exercise });
}
