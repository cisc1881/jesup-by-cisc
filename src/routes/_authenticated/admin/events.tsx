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
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { Pencil, Trash2, Users } from "lucide-react";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/events")({ component: AdminEvents });

const empty = { title: "", description: "", starts_at: "", ends_at: "", location: "", capacity: "", image_url: "", registration_open: true };

function AdminEvents() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [regsOpen, setRegsOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => (await supabase.from("events").select("*").order("starts_at", { ascending: false })).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  const { data: regs } = useQuery({
    queryKey: ["event-regs-admin", regsOpen],
    enabled: !!regsOpen,
    queryFn: async () => (await supabase.from("event_registrations")
      .select("id,notes,created_at,profiles(full_name,email)")
      .eq("event_id", regsOpen!)).data ?? [],
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) {
    setEditing(r);
    setForm({
      ...empty, ...r,
      starts_at: r.starts_at ? new Date(r.starts_at).toISOString().slice(0, 16) : "",
      ends_at: r.ends_at ? new Date(r.ends_at).toISOString().slice(0, 16) : "",
      capacity: r.capacity ?? "",
    });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { ...form, capacity: form.capacity === "" ? null : Number(form.capacity), ends_at: form.ends_at || null };
    const res = editing
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-events"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-events"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Events & Workshops" searchValue={q} onSearchChange={setQ} onNew={openNew}
        onExport={() => downloadCsv("events", rows, [
          { header: "Title", get: (r) => r.title }, { header: "Starts", get: (r) => r.starts_at },
          { header: "Location", get: (r) => r.location }, { header: "Capacity", get: (r) => r.capacity },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>When</TableHead><TableHead>Location</TableHead><TableHead>Open</TableHead><TableHead className="w-32"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No events.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmtDateTime(r.starts_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                <TableCell><Badge variant={r.registration_open ? "default" : "secondary"}>{r.registration_open ? "Open" : "Closed"}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setRegsOpen(r.id)}><Users className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} event</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starts *</Label><Input type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>
            <div><Label>Location</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.registration_open} onCheckedChange={(v) => setForm({ ...form, registration_open: v })} /><Label>Registration open</Label></div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!regsOpen} onOpenChange={(v) => !v && setRegsOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>Registrations</DialogTitle></DialogHeader>
          <Button variant="outline" size="sm" onClick={() => downloadCsv("registrations", regs ?? [], [
            { header: "Name", get: (r: any) => r.profiles?.full_name }, { header: "Email", get: (r: any) => r.profiles?.email },
            { header: "Notes", get: (r: any) => r.notes }, { header: "Registered", get: (r: any) => r.created_at },
          ])} className="w-fit">Export CSV</Button>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {(regs ?? []).length === 0 && <TableRow><TableCell colSpan={3} className="py-4 text-center text-muted-foreground">No registrations.</TableCell></TableRow>}
              {(regs ?? []).map((r: any) => (
                <TableRow key={r.id}><TableCell>{r.profiles?.full_name}</TableCell><TableCell>{r.profiles?.email}</TableCell><TableCell className="text-sm text-muted-foreground">{r.notes}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
