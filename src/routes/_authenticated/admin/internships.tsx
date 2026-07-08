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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { Pencil, Trash2, Users } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/internships")({ component: AdminInternships });

const empty = { title: "", description: "", department: "", deadline: "", is_open: true };

function AdminInternships() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data } = useQuery({
    queryKey: ["admin-internships"],
    queryFn: async () => (await supabase.from("internships").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  const { data: apps } = useQuery({
    queryKey: ["admin-apps", appsOpen],
    enabled: !!appsOpen,
    queryFn: async () => (await supabase.from("internship_applications")
      .select("id,status,cover_letter,resume_url,created_at,profiles(full_name,email,phone)")
      .eq("internship_id", appsOpen!).order("created_at", { ascending: false })).data ?? [],
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm({ ...empty, ...r, deadline: r.deadline ?? "" }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { ...form, deadline: form.deadline || null };
    const res = editing ? await supabase.from("internships").update(payload).eq("id", editing.id) : await supabase.from("internships").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-internships"] });
  }
  async function del(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("internships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-internships"] });
  }
  async function setStatus(appId: string, status: string) {
    const { error } = await supabase.from("internship_applications").update({ status: status as any }).eq("id", appId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-apps"] });
  }
  async function resumeLink(path: string) {
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Internships" searchValue={q} onSearchChange={setQ} onNew={openNew}
        onExport={() => downloadCsv("internships", rows, [
          { header: "Title", get: (r) => r.title }, { header: "Department", get: (r) => r.department },
          { header: "Deadline", get: (r) => r.deadline }, { header: "Open", get: (r) => r.is_open },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead><TableHead className="w-32"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">None yet.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.department}</TableCell>
                <TableCell>{fmtDate(r.deadline)}</TableCell>
                <TableCell><Badge variant={r.is_open ? "default" : "secondary"}>{r.is_open ? "Open" : "Closed"}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setAppsOpen(r.id)}><Users className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} internship</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={form.department ?? ""} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Deadline</Label><Input type="date" value={form.deadline ?? ""} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_open} onCheckedChange={(v) => setForm({ ...form, is_open: v })} /><Label>Open for applications</Label></div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!appsOpen} onOpenChange={(v) => !v && setAppsOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Applications</DialogTitle></DialogHeader>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => downloadCsv("applications", apps ?? [], [
            { header: "Name", get: (r: any) => r.profiles?.full_name }, { header: "Email", get: (r: any) => r.profiles?.email },
            { header: "Status", get: (r: any) => r.status }, { header: "Applied", get: (r: any) => r.created_at },
          ])}>Export CSV</Button>
          <div className="space-y-3">
            {(apps ?? []).length === 0 && <p className="text-muted-foreground">No applications.</p>}
            {(apps ?? []).map((a: any) => (
              <Card key={a.id}><CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{a.profiles?.full_name || "—"}</div>
                    <div className="text-sm text-muted-foreground">{a.profiles?.email} · {a.profiles?.phone}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Applied {fmtDate(a.created_at)}</div>
                  </div>
                  <Select value={a.status} onValueChange={(v) => setStatus(a.id, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {a.cover_letter && <p className="mt-2 whitespace-pre-wrap text-sm">{a.cover_letter}</p>}
                {a.resume_url && <Button size="sm" variant="outline" className="mt-2" onClick={() => resumeLink(a.resume_url)}>View resume</Button>}
              </CardContent></Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
