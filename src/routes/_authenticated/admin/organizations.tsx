import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/modules/admin/components/admin-module-placeholder";

export const Route = createFileRoute("/_authenticated/admin/organizations")({
  component: () => (
    <AdminModulePlaceholder
      title="Organizations"
      description="Track affiliated organizations, coalitions, and institutional partners beyond the public Partners page."
    />
  ),
});
