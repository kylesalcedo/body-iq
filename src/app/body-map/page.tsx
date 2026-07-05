import { getBodyMapData } from "@/lib/queries";
import { BodyMap } from "@/components/body-map";
import { PageHeader } from "@/components/ui-helpers";

export const metadata = {
  title: "Body Map · Body IQ",
};

export default async function BodyMapPage() {
  const regions = await getBodyMapData();

  return (
    <div>
      <PageHeader
        title="Body Map"
        subtitle="Explore the body region by region — click a marker to dive into its joints, movements, and exercises"
      />
      <BodyMap regions={regions} />
    </div>
  );
}
