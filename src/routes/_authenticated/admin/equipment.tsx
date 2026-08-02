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
import { ClipboardCheck, Pencil, Trash2 } from "lucide-react";
import { fmtDate, fmtDateTime } from "@/lib/format";

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
  const [managing, setManaging] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({ status: "pending", admin_notes: "", condition_out: "", condition_in: "" });
  const [savingRequest, setSavingRequest] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["admin-equipment"],
    queryFn: async () => (await supabase.from("equipment").select("*").order("name")).data ?? [],
  });
  const rows = (items ?? []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  const { data: requests } = useQuery({
    queryKey: ["admin-checkouts"],
    queryFn: async () => (await supabase.from("equipment_checkouts")
      .select("id,quantity,checkout_date,return_date,status,notes,admin_notes,condition_out,condition_in,approved_at,checked_out_at,returned_at,created_at,equipment(id,name),profiles!equipment_checkouts_user_profile_fkey(full_name,email)")
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
  function openRequest(r: any) {
    setManaging(r);
    setRequestForm({
      status: r.status,
      admin_notes: r.admin_notes ?? "",
      condition_out: r.condition_out ?? "",
      condition_in: r.condition_in ?? "",
    });
  }

  async function saveRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!managing) return;
    setSavingRequest(true);
    const { error } = await supabase.from("equipment_checkouts").update({
      status: requestForm.status as any,
      admin_notes: requestForm.admin_notes || null,
      condition_out: requestForm.condition_out || null,
      condition_in: requestForm.condition_in || null,
    } as never).eq("id", managing.id);
    setSavingRequest(false);
    if (error) return toast.error(error.message);
    toast.success(`Request marked ${requestForm.status.replace("_", " ")}`);
    setManaging(null);
    qc.invalidateQueries({ queryKey: ["admin-checkouts"] });
    qc.invalidateQueries({ queryKey: ["my-checkouts"] });
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
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}><Pencil className="h-4 w-4" /></Button>
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
                    <TableCell><Button variant="outline" size="sm" onClick={() => openRequest(r)}><ClipboardCheck className="mr-2 h-4 w-4" />Manage</Button></TableCell>
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
      <Dialog open={!!managing} onOpenChange={(next) => { if (!next) setManaging(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Manage equipment request</DialogTitle></DialogHeader>
          {managing && <form onSubmit={saveRequest} className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold">{managing.equipment?.name} · Qty {managing.quantity}</p>
              <p>{managing.profiles?.full_name} · {managing.profiles?.email}</p>
              <p>{fmtDate(managing.checkout_date)} → {fmtDate(managing.return_date)}</p>
              {managing.notes && <p className="mt-2"><span className="font-medium">Request details:</span> {managing.notes}</p>}
            </div>
            <div><Label htmlFor="checkout-status">Status</Label><Select value={requestForm.status} onValueChange={(status) => setRequestForm({ ...requestForm, status })}>
              <SelectTrigger id="checkout-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem><SelectItem value="checked_out">Checked out</SelectItem><SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select></div>
            <div><Label htmlFor="checkout-admin-notes">Staff note visible to requester</Label><Textarea id="checkout-admin-notes" name="admin_notes" value={requestForm.admin_notes} onChange={(e) => setRequestForm({ ...requestForm, admin_notes: e.target.value })} placeholder="Pickup instructions, denial reason, or other guidance" /></div>
            <div><Label htmlFor="checkout-condition-out">Condition at pickup</Label><Textarea id="checkout-condition-out" name="condition_out" value={requestForm.condition_out} onChange={(e) => setRequestForm({ ...requestForm, condition_out: e.target.value })} placeholder="Record accessories and existing wear" /></div>
            <div><Label htmlFor="checkout-condition-in">Condition at return</Label><Textarea id="checkout-condition-in" name="condition_in" value={requestForm.condition_in} onChange={(e) => setRequestForm({ ...requestForm, condition_in: e.target.value })} placeholder="Record returned condition and missing items" /></div>
            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
              <span>Approved: {managing.approved_at ? fmtDateTime(managing.approved_at) : "—"}</span>
              <span>Picked up: {managing.checked_out_at ? fmtDateTime(managing.checked_out_at) : "—"}</span>
              <span>Returned: {managing.returned_at ? fmtDateTime(managing.returned_at) : "—"}</span>
            </div>
            <Button type="submit" disabled={savingRequest} className="w-full">{savingRequest ? "Saving…" : "Save request"}</Button>
          </form>}
        </DialogContent>
      </Dialog>
      {dialog}
    </AdminShell>
  );
}
