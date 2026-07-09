import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { PodcastFormDialog } from "@/components/admin/podcast-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { deletePodcast, fetchAdminPodcasts } from "@/lib/podcasts";
import { fmtDate, fmtDuration } from "@/lib/format";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/podcasts")({ component: AdminPodcasts });

function AdminPodcasts() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-podcasts"],
    queryFn: fetchAdminPodcasts,
  });

  const rows = (data ?? []).filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.guest ?? "").toLowerCase().includes(q.toLowerCase()) ||
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

  async function del(id: string, title: string) {
    await confirmAndDelete({
      entityLabel: "episode",
      itemName: title,
      onDelete: () => deletePodcast(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["admin-podcasts"] });
        qc.invalidateQueries({ queryKey: ["podcasts"] });
        qc.invalidateQueries({ queryKey: ["home-page"] });
      },
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Podcasts"
        description="Manage podcast episodes, covers, audio, and featured content for JESUP."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("podcast_episodes", rows, [
            { header: "Title", get: (r) => r.title },
            { header: "Guest", get: (r) => r.guest },
            { header: "Category", get: (r) => r.category },
            { header: "Published", get: (r) => r.publishedAt },
            { header: "Duration", get: (r) => fmtDuration(r.durationSeconds) },
            { header: "Status", get: (r) => (r.isPublished ? "Published" : "Draft") },
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
                <TableHead>Guest</TableHead>
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
                    No episodes yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.slug}</div>
                  </TableCell>
                  <TableCell>{r.guest ?? "—"}</TableCell>
                  <TableCell>{r.category ?? "—"}</TableCell>
                  <TableCell>{fmtDate(r.publishedAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={r.isPublished ? "default" : "secondary"}>
                        {r.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {r.isFeatured && <Badge variant="outline">Featured</Badge>}
                    </div>
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

      <PodcastFormDialog
        open={open}
        onOpenChange={setOpen}
        episodeId={editingId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-podcasts"] });
          qc.invalidateQueries({ queryKey: ["podcasts"] });
          qc.invalidateQueries({ queryKey: ["podcast-categories"] });
          qc.invalidateQueries({ queryKey: ["podcast-featured"] });
          qc.invalidateQueries({ queryKey: ["home-page"] });
        }}
      />
      {dialog}
    </AdminShell>
  );
}
