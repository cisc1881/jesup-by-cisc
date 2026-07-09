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
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/grants")({ component: AdminGrants });

const empty = { title: "", funder: "", description: "", amount: "", deadline: "", url: "" };

function AdminGrants() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data } = useQuery({
    queryKey: ["admin-grants"],
    queryFn: async () => (await supabase.from("grants").select("*").order("deadline", { ascending: true, nullsFirst: false })).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm({ ...empty, ...r, deadline: r.deadline ?? "" }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { ...form, deadline: form.deadline || null };
    const res = editing ? await supabase.from("grants").update(payload).eq("id", editing.id) : await supabase.from("grants").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-grants"] });
  }
  async function del(id: string, title: string) {
    await confirmAndDelete({
      entityLabel: "grant",
      itemName: title,
      onDelete: async () => {
        const { error } = await supabase.from("grants").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-grants"] }),
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Grants" searchValue={q} onSearchChange={setQ} onNew={openNew}
        onExport={() => downloadCsv("grants", rows, [
          { header: "Title", get: (r) => r.title }, { header: "Funder", get: (r) => r.funder },
          { header: "Amount", get: (r) => r.amount }, { header: "Deadline", get: (r) => r.deadline },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Funder</TableHead><TableHead>Deadline</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">None yet.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.funder}</TableCell>
                <TableCell>{fmtDate(r.deadline)}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id, r.title)} aria-label={`Delete ${r.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} grant</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Funder</Label><Input value={form.funder ?? ""} onChange={(e) => setForm({ ...form, funder: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Amount</Label><Input value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. Up to $25,000" /></div>
            <div><Label>Deadline</Label><Input type="date" value={form.deadline ?? ""} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            <div><Label>Application URL</Label><Input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
      {dialog}
    </AdminShell>
  );
}
