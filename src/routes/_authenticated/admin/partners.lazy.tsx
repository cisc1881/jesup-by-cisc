import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { PartnerFormDialog } from "@/components/admin/partner-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { deletePartner, fetchAdminPartners } from "@/lib/partners";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/partners")({ component: AdminPartners });

function AdminPartners() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: fetchAdminPartners,
  });

  const rows = (data ?? []).filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      (r.category ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  function openNew() {
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setOpen(true);
  }

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-partners"] });
    qc.invalidateQueries({ queryKey: ["partners"] });
    qc.invalidateQueries({ queryKey: ["partner-impact-counts"] });
    qc.invalidateQueries({ queryKey: ["home-page"] });
  }

  async function del(id: string, name: string) {
    await confirmAndDelete({
      entityLabel: "partner",
      itemName: name,
      onDelete: () => deletePartner(id),
      onSuccess: invalidateAll,
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Strategic Partners"
        description="Manage partner profiles, logos, categories, focus areas, and related content."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("partners", rows, [
            { header: "Name", get: (r) => r.name },
            { header: "Category", get: (r) => r.category },
            { header: "Featured", get: (r) => (r.isFeatured ? "Yes" : "No") },
            { header: "Published", get: (r) => (r.isPublished ? "Yes" : "No") },
            { header: "Website", get: (r) => r.websiteUrl },
          ])
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No partners yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.slug}</div>
                  </TableCell>
                  <TableCell>{r.category ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={r.isPublished ? "default" : "secondary"}>
                        {r.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {r.isFeatured && <Badge variant="outline">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{r.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r.id)} aria-label={`Edit ${r.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del(r.id, r.name)} aria-label={`Delete ${r.name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PartnerFormDialog open={open} onOpenChange={setOpen} partnerId={editingId} onSaved={invalidateAll} />
      {dialog}
    </AdminShell>
  );
}
