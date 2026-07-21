import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks — functional tasks (everyday activities). filter: ?category=ADL
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const where: any = {};
  if (category) where.category = category;
  const tasks = await prisma.functionalTask.findMany({
    where, orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { slug: true, name: true, category: true, description: true, _count: { select: { exercises: true } } },
  });
  return NextResponse.json({ count: tasks.length, tasks });
}
