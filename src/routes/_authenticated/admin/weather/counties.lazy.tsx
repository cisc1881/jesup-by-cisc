import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { CountyEmergencyFormDialog } from "@/components/admin/county-emergency-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  archiveCountyEmergencyContact,
  fetchAdminCountyEmergencyContacts,
} from "@/lib/county-emergency-contacts";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { Pencil, Archive } from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/_authenticated/admin/weather/counties")({
  component: AdminWeatherCounties,
});

function AdminWeatherCounties() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-county-emergency-contacts"],
    queryFn: fetchAdminCountyEmergencyContacts,
  });

  const rows = (data ?? []).filter((row) => {
    const haystack = `${row.countyName} ${row.stateCode} ${row.agencyName}`.toLowerCase();
    return !q || haystack.includes(q.toLowerCase());
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-county-emergency-contacts"] });
  }

  async function archive(id: string, label: string) {
    await confirmAndDelete({
      entityLabel: "county emergency record",
      itemName: label,
      onDelete: () => archiveCountyEmergencyContact(id),
      onSuccess: () => {
        invalidateAll();
        toast.success("County record archived");
      },
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="County Emergency Directory"
        description="Manage verified county emergency-management contacts for the Weather & Emergency Center."
        searchValue={q}
        onSearchChange={setQ}
        onNew={() => {
          setEditingId(null);
          setOpen(true);
        }}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>County</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.countyName}</TableCell>
                  <TableCell>{row.stateCode}</TableCell>
                  <TableCell>{row.agencyName}</TableCell>
                  <TableCell>{row.primaryPhone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={row.verificationStatus === "verified" ? "default" : "secondary"}>
                      {row.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.verifiedDate ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(row.id);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => archive(row.id, row.countyName)}>
                        <Archive className="size-4" />
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CountyEmergencyFormDialog
        open={open}
        onOpenChange={setOpen}
        recordId={editingId}
        onSaved={invalidateAll}
      />
      {dialog}
    </AdminShell>
  );
}
