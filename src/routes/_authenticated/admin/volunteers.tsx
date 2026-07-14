import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/modules/admin/components/admin-module-placeholder";

export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  component: () => (
    <AdminModulePlaceholder
      title="Volunteers"
      description="Coordinate volunteer sign-ups, assignments, and service hours across CISC programs."
    />
  ),
});
