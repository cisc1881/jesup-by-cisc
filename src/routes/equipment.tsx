import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Package } from "lucide-react";

export const Route = createFileRoute("/equipment")({
  head: () => ({ meta: [{ title: "Equipment Checkout · CISC Connect" }, { name: "description", content: "Reserve equipment for your community project." }] }),
  component: EquipmentPage,
});

function EquipmentPage() {
  const { data } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <PageHeader title="Equipment Catalog" description="Reserve tools, sensors, and gear for your project." />
      <div className="mx-auto max-w-6xl px-4 py-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(!data || data.length === 0) && <p className="text-muted-foreground">No equipment available.</p>}
        {data?.map((it) => <EquipmentCard key={it.id} it={it} />)}
      </div>
    </PublicLayout>
  );
}

function EquipmentCard({ it }: { it: any }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return navigate({ to: "/auth", search: { next: "/equipment" } });
    if (new Date(end) < new Date(start)) return toast.error("Return date must be on/after checkout date");

    setBusy(true);
    // Availability check: sum overlapping approved/checked_out reservations
    const { data: overlaps, error: e1 } = await supabase.from("equipment_checkouts")
      .select("quantity")
      .eq("equipment_id", it.id)
      .in("status", ["approved", "checked_out"])
      .lte("checkout_date", end)
      .gte("return_date", start);
    if (e1) { setBusy(false); return toast.error(e1.message); }
    const reserved = (overlaps ?? []).reduce((s, r) => s + (r.quantity ?? 0), 0);
    if (reserved + qty > it.quantity_total) {
      setBusy(false);
      return toast.error(`Not enough available. ${Math.max(0, it.quantity_total - reserved)} left in that window.`);
    }

    const { error } = await supabase.from("equipment_checkouts").insert({
      equipment_id: it.id, user_id: user.id, quantity: qty, checkout_date: start, return_date: end, status: "pending", notes: notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted — an admin will review it.");
    setOpen(false); setQty(1); setStart(""); setEnd(""); setNotes("");
    qc.invalidateQueries({ queryKey: ["my-checkouts"] });
  }

  return (
    <Card>
      {it.image_url ? (
        <div className="h-40 bg-cover bg-center rounded-t-xl" style={{ backgroundImage: `url(${it.image_url})` }} />
      ) : (
        <div className="grid h-40 place-items-center rounded-t-xl bg-primary/10"><Package className="h-10 w-10 text-primary/60" /></div>
      )}
      <CardContent className="p-5">
        {it.category && <div className="text-xs font-medium uppercase tracking-wider text-accent">{it.category}</div>}
        <h3 className="mt-1 font-serif text-lg font-semibold text-primary">{it.name}</h3>
        {it.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{it.description}</p>}
        <p className="mt-2 text-xs text-muted-foreground">Total in inventory: {it.quantity_total}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-3 w-full bg-primary hover:bg-primary/90" onClick={(e) => { if (!user) { e.preventDefault(); navigate({ to: "/auth", search: { next: "/equipment" } }); } }}>
              {user ? "Request checkout" : "Sign in to request"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Request · {it.name}</DialogTitle></DialogHeader>
            <form onSubmit={request} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity</Label><Input type="number" min={1} max={it.quantity_total} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Checkout date</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} required /></div>
                <div><Label>Return date</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required /></div>
              </div>
              <div><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary/90">{busy ? "Submitting…" : "Submit request"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
