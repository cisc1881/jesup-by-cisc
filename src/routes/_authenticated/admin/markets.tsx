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

export const Route = createFileRoute("/_authenticated/admin/markets")({ component: AdminMarkets });

const empty = { name: "", description: "", address: "", city: "", state: "", lat: "", lng: "", hours: "", season: "", image_url: "" };

function AdminMarkets() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data } = useQuery({
    queryKey: ["admin-markets"],
    queryFn: async () => (await supabase.from("markets").select("*").order("name")).data ?? [],
  });
  const rows = (data ?? []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) {
    setEditing(r);
    setForm({ ...empty, ...r, lat: r.lat ?? "", lng: r.lng ?? "" });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, lat: form.lat === "" ? null : Number(form.lat), lng: form.lng === "" ? null : Number(form.lng) };
    const res = editing
      ? await supabase.from("markets").update(payload).eq("id", editing.id)
      : await supabase.from("markets").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-markets"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this market?")) return;
    const { error } = await supabase.from("markets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-markets"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Farmers Markets" searchValue={q} onSearchChange={setQ} onNew={openNew}
        onExport={() => downloadCsv("markets", rows, [
          { header: "Name", get: (r) => r.name }, { header: "Address", get: (r) => r.address },
          { header: "City", get: (r) => r.city }, { header: "State", get: (r) => r.state },
          { header: "Hours", get: (r) => r.hours }, { header: "Season", get: (r) => r.season },
        ])}
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Hours</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No markets.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{[r.city, r.state].filter(Boolean).join(", ")}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.hours}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} market</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Latitude</Label><Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} /></div>
              <div><Label>Longitude</Label><Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} /></div>
            </div>
            <div><Label>Hours</Label><Input value={form.hours ?? ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
            <div><Label>Season</Label><Input value={form.season ?? ""} onChange={(e) => setForm({ ...form, season: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
