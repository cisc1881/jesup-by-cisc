import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, QrCode } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { productDb } from "@/lib/product-db";
import { walletPassState } from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/me/wallet")({ component: WalletPage });

function WalletPage() {
  const { user } = useAuth();
  const {
    data: registrations = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["wallet-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id,event_id,status,ticket_code,events(title,starts_at,location)")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: passes = [] } = useQuery({
    queryKey: ["wallet-passes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await productDb
        .from("jesup_wallet_passes")
        .select("*")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false });
      if (error?.code === "PGRST205" || error?.code === "42P01") return [];
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="My JESUP"
        title="Wallet"
        description="Your event credentials in one place."
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 pb-28 sm:px-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading your credentials…</p>}
        {isError && (
          <p role="alert" className="text-sm text-destructive">
            Your credentials could not be loaded. Please try again.
          </p>
        )}
        {!isLoading && !isError && registrations.length === 0 && passes.length === 0 && (
          <div className="rounded-3xl border bg-card p-8 text-center">
            <Ticket className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 text-xl font-bold">No event tickets yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Register for an event to receive your QR credential.
            </p>
            <Link
              to="/events"
              search={{ view: "explore" }}
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground"
            >
              Explore events
            </Link>
          </div>
        )}
        {registrations.map((registration) => (
          <article
            key={registration.id}
            className="overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-soft)]"
          >
            <div className="grad-jesup p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                Jesup event credential
              </p>
              <h2 className="mt-2 text-xl font-black">{registration.events?.title ?? "Event"}</h2>
              <p className="mt-2 text-sm text-white/80">
                {registration.events?.starts_at ? fmtDateTime(registration.events.starts_at) : ""}
                {registration.events?.location ? ` · ${registration.events.location}` : ""}
              </p>
            </div>
            <div className="p-6 text-center">
              {registration.ticket_code ? (
                <>
                  <div className="mx-auto w-fit rounded-xl bg-white p-4">
                    <QRCodeSVG
                      value={registration.ticket_code}
                      size={220}
                      level="M"
                      marginSize={1}
                    />
                  </div>
                  <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
                    {registration.ticket_code}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Present this code for event check-in and eligible entitlements.
                  </p>
                </>
              ) : (
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="h-5 w-5" />
                  QR credential pending
                </p>
              )}
              <Link
                to="/events/$id/hub"
                params={{ id: registration.event_id }}
                className="mt-5 inline-flex min-h-11 items-center rounded-xl border px-5 font-bold"
              >
                Open event
              </Link>
            </div>
          </article>
        ))}
        {passes.length > 0 && (
          <section className="space-y-4" aria-labelledby="wallet-passes-heading">
            <h2 id="wallet-passes-heading" className="text-2xl font-black">
              Other passes
            </h2>
            {passes.map((pass) => (
              <article
                key={pass.id}
                className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {pass.kind.replaceAll("_", " ")} · {walletPassState(pass)}
                </p>
                <h3 className="mt-2 text-xl font-black">{pass.title}</h3>
                {pass.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{pass.subtitle}</p>
                )}
                {pass.valid_until && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Valid through {fmtDateTime(pass.valid_until)}
                  </p>
                )}
                {walletPassState(pass) === "active" && (
                  <div className="mx-auto mt-5 w-fit rounded-xl bg-white p-4">
                    <QRCodeSVG value={pass.token} size={180} level="M" marginSize={1} />
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
