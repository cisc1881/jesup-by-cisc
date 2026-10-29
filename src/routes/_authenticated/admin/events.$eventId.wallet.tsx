import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productDb } from "@/lib/product-db";

export const Route = createFileRoute("/_authenticated/admin/events/$eventId/wallet")({
  component: WalletIssuer,
});

const kinds = ["parking", "certificate", "badge", "vip"] as const;

function WalletIssuer() {
  const { eventId } = Route.useParams();
  const qc = useQueryClient();
  const [registrationId, setRegistrationId] = useState("");
  const [kind, setKind] = useState<(typeof kinds)[number]>("parking");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: registrations = [] } = useQuery({
    queryKey: ["wallet-issuer-registrations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id,user_id,attendee_name,attendee_email")
        .eq("event_id", eventId)
        .eq("status", "registered")
        .not("user_id", "is", null)
        .order("attendee_name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: passes = [], isError } = useQuery({
    queryKey: ["admin-wallet-passes", eventId],
    queryFn: async () => {
      const { data, error } = await productDb
        .from("jesup_wallet_passes")
        .select("id,registration_id,kind,title,status,issued_at")
        .eq("event_id", eventId)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const registration = registrations.find((item) => item.id === registrationId);
    if (!registration?.user_id) {
      toast.error("Choose a registration linked to a Jesup account.");
      return;
    }
    setBusy(true);
    const { error } = await productDb.from("jesup_wallet_passes").insert({
      user_id: registration.user_id,
      event_id: eventId,
      registration_id: registration.id,
      kind,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
    });
    setBusy(false);
    if (error) {
      toast.error("Pass could not be issued.");
      return;
    }
    setTitle("");
    setSubtitle("");
    setValidUntil("");
    await qc.invalidateQueries({ queryKey: ["admin-wallet-passes", eventId] });
    await qc.invalidateQueries({ queryKey: ["wallet-passes", registration.user_id] });
    toast.success("Pass issued.");
  }

  async function revoke(id: string) {
    const { error } = await productDb
      .from("jesup_wallet_passes")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Pass could not be revoked.");
    else await qc.invalidateQueries({ queryKey: ["admin-wallet-passes", eventId] });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Event operations
        </p>
        <h1 className="mt-2 text-3xl font-black">Wallet passes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Issue scoped passes to attendees with Jesup accounts. Event registration QR codes remain
          separate.
        </p>
      </header>
      <form
        onSubmit={(event) => void issue(event)}
        className="grid gap-4 rounded-2xl border bg-card p-5"
      >
        <label className="text-sm font-bold">
          Attendee
          <select
            required
            value={registrationId}
            onChange={(event) => setRegistrationId(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          >
            <option value="">Choose a registration</option>
            {registrations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.attendee_name || item.attendee_email || item.id}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Pass type
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as (typeof kinds)[number])}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          >
            {kinds.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Title
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Details
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Valid until
          <input
            type="datetime-local"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <button
          type="submit"
          disabled={busy || isError}
          className="min-h-11 rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Issuing…" : "Issue pass"}
        </button>
      </form>
      <section aria-label="Issued passes" className="space-y-2">
        {isError && (
          <p role="alert" className="text-destructive">
            Passes could not be loaded. Apply the product migration if needed.
          </p>
        )}
        {passes.length === 0 && !isError && (
          <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            No passes issued for this event.
          </p>
        )}
        {passes.map((pass) => (
          <div key={pass.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="flex-1">
              <p className="font-bold">{pass.title}</p>
              <p className="text-xs text-muted-foreground">
                {pass.kind} · {pass.status}
              </p>
            </div>
            {pass.status === "active" && (
              <button
                type="button"
                onClick={() => void revoke(pass.id)}
                className="min-h-11 rounded-lg border px-4 text-sm font-bold"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
