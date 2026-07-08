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
import { downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/publications")({ component: AdminPubs });

const empty = { title: "", description: "", category: "", file_url: "", external_url: "", published_at: "" };

function AdminPubs() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-pubs"],
    queryFn: async () => (await supabase.from("publications").select("*").order("published_at", { ascending: false, nullsFirst: false })).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm({ ...empty, ...r, published_at: r.published_at ?? "" }); setOpen(true); }

  async function uploadFile(file: File) {
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("publications").upload(path, file, { upsert: true });
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const { data: pub } = supabase.storage.from("publications").getPublicUrl(path);
    setForm((f: any) => ({ ...f, file_url: pub.publicUrl }));
    setUploading(false);
    toast.success("Uploaded");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { ...form, published_at: form.published_at || null };
    const res = editing
      ? await supabase.from("publications").update(payload).eq("id", editing.id)
      : await supabase.from("publications").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-pubs"] });
  }
  async function del(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("publications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-pubs"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Publications" searchValue={q} onSearchChange={setQ} onNew={openNew}
        onExport={() => downloadCsv("publications", rows, [
          { header: "Title", get: (r) => r.title }, { header: "Category", get: (r) => r.category },
          { header: "Published", get: (r) => r.published_at },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Published</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">None yet.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{fmtDate(r.published_at)}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} publication</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>Published date</Label><Input type="date" value={form.published_at ?? ""} onChange={(e) => setForm({ ...form, published_at: e.target.value })} /></div>
            <div>
              <Label>Upload PDF</Label>
              <Input type="file" accept="application/pdf" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              {form.file_url && <p className="mt-1 text-xs text-muted-foreground truncate">Uploaded: {form.file_url}</p>}
            </div>
            <div><Label>Or file URL</Label><Input value={form.file_url ?? ""} onChange={(e) => setForm({ ...form, file_url: e.target.value })} /></div>
            <div><Label>External URL</Label><Input value={form.external_url ?? ""} onChange={(e) => setForm({ ...form, external_url: e.target.value })} /></div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
