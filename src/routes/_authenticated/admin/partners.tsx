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

export const Route = createFileRoute("/_authenticated/admin/partners")({ component: AdminPartners });

const empty = { name: "", slug: "", description: "", logo_url: "", website_url: "", category: "", sort_order: 0, is_published: true };
function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function AdminPartners() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => (await supabase.from("partners").select("*").order("sort_order", { ascending: true })).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm({ ...empty, ...r }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { ...form, slug: form.slug || slugify(form.name), sort_order: Number(form.sort_order || 0) };
    const res = editing ? await supabase.from("partners").update(payload).eq("id", editing.id) : await supabase.from("partners").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-partners"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this partner?")) return;
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-partners"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Partners" searchValue={q} onSearchChange={setQ} onNew={openNew}
        onExport={() => downloadCsv("partners", rows, [
          { header: "Name", get: (r) => r.name }, { header: "Category", get: (r) => r.category },
          { header: "Website", get: (r) => r.website_url },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Website</TableHead><TableHead>Order</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No partners yet.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell className="truncate">{r.website_url}</TableCell>
                <TableCell>{r.sort_order}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} partner</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></div>
            <div><Label>Category</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. University, Government, Community" /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Logo URL</Label><Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
            <div><Label>Website URL</Label><Input value={form.website_url ?? ""} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></div>
            <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
            <Button type="submit" className="w-full grad-crimson text-white">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
