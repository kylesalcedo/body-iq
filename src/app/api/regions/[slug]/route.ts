import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/regions/[slug] — a region with its joints (and movement counts).
export async function GET(_r: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const r = await prisma.region.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true, name: true, description: true, status: true, confidence: true,
      joints: {
        orderBy: { name: "asc" },
        select: { slug: true, name: true, jointType: true, _count: { select: { movements: true } } },
      },
      sources: { select: { source: { select: { slug: true, title: true, authors: true, year: true, pmid: true, doi: true } } } },
    },
  });
  if (!r) return NextResponse.json({ error: `Region not found: ${params.slug}` }, { status: 404 });
  const { joints, sources, ...rest } = r;
  return NextResponse.json({
    ...rest,
    joints: joints.map((j) => ({ slug: j.slug, name: j.name, jointType: j.jointType, movementCount: j._count.movements })),
    sources: sources.map((x) => x.source),
  });
}
