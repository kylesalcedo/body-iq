import { getPlannerData } from "@/lib/queries";
import { PlannerGrid } from "@/components/planner-grid";

export const dynamic =
  process.env.STATIC_EXPORT === "1" ? "force-static" : "force-dynamic";

export default async function PlannerPage() {
  const data = await getPlannerData();
  return <PlannerGrid data={data} />;
}
