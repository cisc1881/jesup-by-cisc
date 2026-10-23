import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/equipment")({
  head: () => listPageHead({ title: "Equipment Checkout", description: "Equipment checkout is not currently offered on JESUP.", path: "/equipment" }),
  component: EquipmentPage,
});

function EquipmentPage() {
  return (
    <PublicLayout>
      <PageHeader title="Equipment Checkout" description="This service is not currently available." />
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-4">
        <p className="text-muted-foreground">
          JESUP no longer offers a public equipment catalog or checkout requests. Past checkout
          records are preserved for the people and programs involved.
        </p>
        <Button asChild variant="outline">
          <Link to="/resources">Browse current resources</Link>
        </Button>
      </div>
    </PublicLayout>
  );
}
