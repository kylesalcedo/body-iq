import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/joints — list joints. filter: ?region=knee
export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region");
  const where: any = {};
  if (region) where.region = { slug: region };
  const joints = await prisma.joint.findMany({
    where, orderBy: { name: "asc" },
    select: {
      slug: true, name: true, jointType: true,
      region: { select: { slug: true, name: true } },
      codes: { select: { system: true, code: true, display: true } },
      _count: { select: { movements: true } },
    },
  });
  return NextResponse.json({ count: joints.length, joints });
}
