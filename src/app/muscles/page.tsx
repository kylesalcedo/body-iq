import { getMuscles } from "@/lib/queries";
import { PageHeader } from "@/components/ui-helpers";
import { MuscleTable } from "@/components/muscle-table";

export default async function MusclesPage() {
  const muscles = await getMuscles();

  return (
    <div>
      <PageHeader title="Muscles" subtitle={`${muscles.length} muscles · origin, insertion, and what they drive`} />
      <MuscleTable muscles={muscles} />
    </div>
  );
}
