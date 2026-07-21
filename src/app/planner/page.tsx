import { getPlannerData } from "@/lib/queries";
import { PlannerGrid } from "@/components/planner-grid";

export const dynamic = "force-static";

export default async function PlannerPage() {
  const data = await getPlannerData();
  return <PlannerGrid data={data} />;
}
