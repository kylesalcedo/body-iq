import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/regions — anatomical regions with joint counts
export async function GET() {
  const regions = await prisma.region.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, description: true, _count: { select: { joints: true } } },
  });
  return NextResponse.json({ count: regions.length, regions });
}
