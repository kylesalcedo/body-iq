import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/movements — list movements with normal ROM reference values
// filters: ?region=knee  ?plane=sagittal  ?q=flexion
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const region = params.get("region");
  const plane = params.get("plane");
  const q = params.get("q");
  const where: any = {};
  if (plane) where.plane = plane;
  if (region) where.joint = { region: { slug: region } };
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }];

  const movements = await prisma.movement.findMany({
    where, orderBy: { name: "asc" },
    select: {
      slug: true, name: true, plane: true, axis: true,
      aromMin: true, aromMax: true, promMin: true, promMax: true, romUnit: true, romSource: true, romNotes: true,
      joint: { select: { slug: true, name: true, region: { select: { slug: true, name: true } } } },
      _count: { select: { muscles: true, exercises: true } },
    },
  });
  return NextResponse.json({ count: movements.length, movements });
}
