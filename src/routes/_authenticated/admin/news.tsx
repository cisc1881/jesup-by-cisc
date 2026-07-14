import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { NewsFormDialog } from "@/components/admin/news-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { deleteNewsArticle, fetchAdminNewsArticles } from "@/lib/news";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { toastActionError } from "@/lib/seo";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/news")({ component: AdminNews });

function AdminNews() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirmDialog();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-news"],
    queryFn: fetchAdminNewsArticles,
  });

  const rows = (data ?? []).filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.category ?? "").toLowerCase().includes(q.toLowerCase()) ||
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

  async function del(id: string, title: string) {
    const ok = await confirm({
      title: "Delete article?",
      description: `"${title}" will be permanently removed from JESUP.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteNewsArticle(id);
      toast.success(`Deleted "${title}"`);
      invalidateAll();
    } catch (err) {
      toastActionError("Delete article", err);
    }
  }

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-news"] });
    qc.invalidateQueries({ queryKey: ["news"] });
    qc.invalidateQueries({ queryKey: ["news-featured"] });
    qc.invalidateQueries({ queryKey: ["home-page"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="News & Stories"
        description="Publish news articles, spotlights, and Extension updates for the JESUP community."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("news", rows, [
            { header: "Title", get: (r) => r.title },
            { header: "Category", get: (r) => r.category },
            { header: "Author", get: (r) => r.author },
            { header: "Featured", get: (r) => (r.isFeatured ? "Yes" : "No") },
            { header: "Published", get: (r) => (r.isPublished ? "Yes" : "No") },
            { header: "Published at", get: (r) => fmtDate(r.publishedAt) },
          ])
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No articles yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.slug}</div>
                  </TableCell>
                  <TableCell>{r.category ?? "—"}</TableCell>
                  <TableCell>{r.author ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={r.isPublished ? "default" : "secondary"}>
                        {r.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {r.isFeatured && <Badge variant="outline">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{fmtDate(r.publishedAt) || "—"}</TableCell>
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

      <NewsFormDialog open={open} onOpenChange={setOpen} articleId={editingId} onSaved={invalidateAll} />
      {dialog}
    </AdminShell>
  );
}
