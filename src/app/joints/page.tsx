import { getJoints } from "@/lib/queries";
import { PageHeader } from "@/components/ui-helpers";
import { JointTable } from "@/components/joint-table";

export default async function JointsPage() {
  const joints = await getJoints();

  return (
    <div>
      <PageHeader title="Joints" subtitle={`${joints.length} joints across all regions`} />
      <JointTable joints={joints} />
    </div>
  );
}
