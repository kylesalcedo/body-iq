import { getFinderData } from "@/lib/queries";
import { ExerciseFinder } from "@/components/exercise-finder";

export default async function FinderPage() {
  const { filters, exercises } = await getFinderData();
  return <ExerciseFinder filters={filters} exercises={exercises} />;
}
