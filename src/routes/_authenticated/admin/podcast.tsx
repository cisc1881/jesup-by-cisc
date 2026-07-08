import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/podcast")({ component: AdminPodcast });

const empty = {
  title: "", slug: "", guest: "", duration_seconds: "" as string | number, description: "",
  cover_url: "", audio_url: "", category: "", published_at: "", is_published: true,
};

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function AdminPodcast() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data } = useQuery({
    queryKey: ["admin-podcast"],
    queryFn: async () => (await supabase.from("podcast_episodes").select("*").order("published_at", { ascending: false, nullsFirst: false })).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm({ ...empty, ...r, published_at: r.published_at ? r.published_at.slice(0, 16) : "" }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      ...form,
      slug: form.slug || slugify(form.title),
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      published_at: form.published_at || null,
    };
    const res = editing ? await supabase.from("podcast_episodes").update(payload).eq("id", editing.id) : await supabase.from("podcast_episodes").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-podcast"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this episode?")) return;
    const { error } = await supabase.from("podcast_episodes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-podcast"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Podcast" searchValue={q} onSearchChange={setQ} onNew={openNew}
        onExport={() => downloadCsv("podcast_episodes", rows, [
          { header: "Title", get: (r) => r.title }, { header: "Guest", get: (r) => r.guest },
          { header: "Category", get: (r) => r.category }, { header: "Published", get: (r) => r.published_at },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Guest</TableHead><TableHead>Category</TableHead><TableHead>Published</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No episodes yet.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.guest}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{r.is_published ? "Yes" : "Draft"}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} episode</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Guest</Label><Input value={form.guest ?? ""} onChange={(e) => setForm({ ...form, guest: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Cover URL</Label><Input value={form.cover_url ?? ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
            <div><Label>Audio URL</Label><Input value={form.audio_url ?? ""} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (seconds)</Label><Input type="number" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })} /></div>
              <div><Label>Published at</Label><Input type="datetime-local" value={form.published_at ?? ""} onChange={(e) => setForm({ ...form, published_at: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
            <Button type="submit" className="w-full grad-crimson text-white">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
