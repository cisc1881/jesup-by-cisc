import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/modules/admin/components/admin-module-placeholder";

export const Route = createFileRoute("/_authenticated/admin/members")({
  component: () => (
    <AdminModulePlaceholder
      title="Members"
      description="Manage community members, memberships, and engagement across the Black Belt."
    />
  ),
});
