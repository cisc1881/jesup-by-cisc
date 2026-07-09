import { createLazyFileRoute } from "@tanstack/react-router";
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
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/publications")({ component: AdminPublications });

function AdminPublications() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-publications"],
    queryFn: fetchAdminPublications,
  });

  const rows = (data ?? []).filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.author ?? "").toLowerCase().includes(q.toLowerCase()),
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
    qc.invalidateQueries({ queryKey: ["admin-publications"] });
    qc.invalidateQueries({ queryKey: ["publications"] });
    qc.invalidateQueries({ queryKey: ["home-page"] });
  }

  async function del(id: string, title: string) {
    await confirmAndDelete({
      entityLabel: "publication",
      itemName: title,
      onDelete: () => deletePublication(id),
      onSuccess: invalidateAll,
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Publications"
        description="Manage factsheets, reports, bulletins, and related content."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("publications", rows, [
            { header: "Title", get: (r) => r.title },
            { header: "Author", get: (r) => r.author },
            { header: "Category", get: (r) => r.categoryName },
            { header: "Type", get: (r) => r.contentTypeLabel },
            { header: "Active", get: (r) => (r.isActive ? "Yes" : "No") },
          ])
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
                  <TableCell>{r.author ?? "—"}</TableCell>
                  <TableCell>{r.categoryName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "default" : "secondary"}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r.id)} aria-label={`Edit ${r.title}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del(r.id, r.title)} aria-label={`Delete ${r.title}`}>
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

      <PublicationFormDialog open={open} onOpenChange={setOpen} publicationId={editingId} onSaved={invalidateAll} />
      {dialog}
    </AdminShell>
  );
}
