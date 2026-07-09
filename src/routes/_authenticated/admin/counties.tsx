import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/modules/admin/components/admin-module-placeholder";

export const Route = createFileRoute("/_authenticated/admin/counties")({
  component: () => (
    <AdminModulePlaceholder
      title="Counties"
      description="Manage county-level Extension coverage, contacts, and regional program reach across Alabama."
    />
  ),
});
