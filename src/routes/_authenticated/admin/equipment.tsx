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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCsv } from "@/lib/csv";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/equipment")({ component: AdminEquipment });

const empty = { name: "", description: "", category: "", quantity_total: 1, image_url: "" };

function AdminEquipment() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [tab, setTab] = useState("inventory");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const { data: items } = useQuery({
    queryKey: ["admin-equipment"],
    queryFn: async () => (await supabase.from("equipment").select("*").order("name")).data ?? [],
  });
  const rows = (items ?? []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  const { data: requests } = useQuery({
    queryKey: ["admin-checkouts"],
    queryFn: async () => (await supabase.from("equipment_checkouts")
      .select("id,quantity,checkout_date,return_date,status,notes,created_at,equipment(id,name),profiles(full_name,email)")
      .order("created_at", { ascending: false })).data ?? [],
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEditing(r); setForm({ ...empty, ...r }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, quantity_total: Number(form.quantity_total) || 1 };
    const res = editing ? await supabase.from("equipment").update(payload).eq("id", editing.id) : await supabase.from("equipment").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-equipment"] });
  }
  async function del(id: string, name: string) {
    await confirmAndDelete({
      entityLabel: "equipment item",
      itemName: name,
      onDelete: async () => {
        const { error } = await supabase.from("equipment").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-equipment"] }),
    });
  }
  async function updateReq(id: string, status: string) {
    const { error } = await supabase.from("equipment_checkouts").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-checkouts"] });
  }

  return (
    <AdminShell>
      <AdminPageHeader title="Equipment" description="Inventory and checkout requests" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="requests">Checkout Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
            <Button variant="outline" onClick={() => downloadCsv("equipment", rows, [
              { header: "Name", get: (r) => r.name }, { header: "Category", get: (r) => r.category }, { header: "Quantity", get: (r) => r.quantity_total },
            ])}>Export CSV</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={openNew}>New</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Qty</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">None yet.</TableCell></TableRow>}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.quantity_total}</TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(r.id, r.name)} aria-label={`Delete ${r.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <div className="mb-3">
            <Button variant="outline" onClick={() => downloadCsv("checkouts", requests ?? [], [
              { header: "Item", get: (r: any) => r.equipment?.name }, { header: "User", get: (r: any) => r.profiles?.full_name },
              { header: "Email", get: (r: any) => r.profiles?.email }, { header: "Qty", get: (r: any) => r.quantity },
              { header: "Checkout", get: (r: any) => r.checkout_date }, { header: "Return", get: (r: any) => r.return_date },
              { header: "Status", get: (r: any) => r.status },
            ])}>Export CSV</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>User</TableHead><TableHead>Dates</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {(requests ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No requests yet.</TableCell></TableRow>}
                {(requests ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.equipment?.name}</TableCell>
                    <TableCell className="text-sm">{r.profiles?.full_name}<br /><span className="text-muted-foreground">{r.profiles?.email}</span></TableCell>
                    <TableCell className="text-sm">{fmtDate(r.checkout_date)} → {fmtDate(r.return_date)}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell><Badge>{r.status}</Badge></TableCell>
                    <TableCell>
                      <Select value={r.status} onValueChange={(v) => updateReq(r.id, v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                          <SelectItem value="checked_out">Checked out</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} equipment</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Quantity in inventory *</Label><Input type="number" min={1} required value={form.quantity_total} onChange={(e) => setForm({ ...form, quantity_total: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
      {dialog}
    </AdminShell>
  );
}
