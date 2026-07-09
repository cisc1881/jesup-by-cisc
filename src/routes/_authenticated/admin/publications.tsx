import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { PublicationFormDialog } from "@/components/admin/publication-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { deletePublication, fetchAdminPublications } from "@/lib/publications";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/publications")({ component: AdminPublications });

function AdminPublications() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-pubs"],
    queryFn: fetchAdminPublications,
  });

  const rows = (data ?? []).filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.categoryName ?? "").toLowerCase().includes(q.toLowerCase()) ||
      r.contentTypeLabel.toLowerCase().includes(q.toLowerCase()),
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
    if (!confirm("Delete this publication?")) return;
    try {
      await deletePublication(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-pubs"] });
      qc.invalidateQueries({ queryKey: ["publications"] });
      qc.invalidateQueries({ queryKey: ["home-page"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Publications"
        description="Manage factsheets, reports, magazines, videos, and external resources."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("publications", rows, [
            { header: "Title", get: (r) => r.title },
            { header: "Type", get: (r) => r.contentTypeLabel },
            { header: "Category", get: (r) => r.categoryName },
            { header: "Published", get: (r) => r.publishedAt },
            { header: "Active", get: (r) => (r.isActive ? "Yes" : "No") },
            { header: "Featured", get: (r) => (r.isFeatured ? "Yes" : "No") },
          ])
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No publications yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.slug}</div>
                  </TableCell>
                  <TableCell>{r.contentTypeLabel || "—"}</TableCell>
                  <TableCell>{r.categoryName ?? "—"}</TableCell>
                  <TableCell>{fmtDate(r.publishedAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                      {r.isFeatured && <Badge variant="outline">Featured</Badge>}
                    </div>
                  </TableCell>
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

      <PublicationFormDialog
        open={open}
        onOpenChange={setOpen}
        publicationId={editingId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-pubs"] });
          qc.invalidateQueries({ queryKey: ["publications"] });
          qc.invalidateQueries({ queryKey: ["home-page"] });
        }}
      />
    </AdminShell>
  );
}
