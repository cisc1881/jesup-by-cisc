import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const Route = createFileRoute("/_authenticated/admin/equipment")({ component: AdminEquipment });

function AdminEquipment() {
  return (
    <div className="space-y-4 p-6">
      <AdminPageHeader title="Equipment" description="This module has been retired" />
      <p className="max-w-2xl text-sm text-muted-foreground">
        Equipment checkout is not a network-wide JESUP module and has been removed from navigation
        and public discovery. Historical inventory and checkout records remain preserved in the
        database; no data was deleted.
      </p>
    </div>
  );
}
