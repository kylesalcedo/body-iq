import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/goals — list goals (rehab / performance / prevention / mobility)
// filters: ?type=performance  ?region=knee  ?q=squat
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const region = params.get("region");
  const q = params.get("q");

  const where: any = {};
  if (type) where.goalType = type;
  if (region) where.region = region;
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }];

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [{ goalType: "asc" }, { name: "asc" }],
    select: { slug: true, name: true, goalType: true, region: true, description: true, _count: { select: { exercises: true } } },
  });

  return NextResponse.json({ count: goals.length, goals: goals.map((g) => ({ ...g, exerciseCount: g._count.exercises, _count: undefined })) });
}
