import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { ProgramFormDialog } from "@/components/admin/program-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { deleteProgram, fetchAdminPrograms } from "@/lib/programs";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/programs")({ component: AdminPrograms });

function AdminPrograms() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: fetchAdminPrograms,
  });

  const rows = (data ?? []).filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.slug.toLowerCase().includes(q.toLowerCase()) ||
      (r.categoryName ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  function openNew() {
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setOpen(true);
  }

  async function del(id: string) {
    if (!confirm("Delete this program and all attachments?")) return;
    try {
      await deleteProgram(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Programs"
        description="Manage signature initiatives, media, and related content."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("programs", rows, [
            { header: "Name", get: (r) => r.name },
            { header: "Slug", get: (r) => r.slug },
            { header: "Category", get: (r) => r.categoryName },
            { header: "Featured", get: (r) => (r.isFeatured ? "Yes" : "No") },
            { header: "Active", get: (r) => (r.isActive ? "Yes" : "No") },
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
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No programs yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.slug}</div>
                  </TableCell>
                  <TableCell>{r.categoryName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.isFeatured ? "default" : "secondary"}>{r.isFeatured ? "Featured" : "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>{r.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del(r.id)}>
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

      <ProgramFormDialog
        open={open}
        onOpenChange={setOpen}
        programId={editingId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-programs"] });
          qc.invalidateQueries({ queryKey: ["programs"] });
          qc.invalidateQueries({ queryKey: ["home-page"] });
        }}
      />
    </AdminShell>
  );
}
