import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3, MapPin, QrCode, Ticket } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { productDb } from "@/lib/product-db";
import { walletPassState } from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/me/wallet")({ component: WalletPage });

function WalletPage() {
  const { user } = useAuth();
  const knownCheckIns = useRef<Map<string, boolean> | null>(null);
  const [confirmedPassId, setConfirmedPassId] = useState<string | null>(null);
  const {
    data: registrations = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["wallet-registrations", user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id,event_id,status,ticket_code,checked_in_at,events(title,starts_at,location)")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const {
    data: passes = [],
    isLoading: passesLoading,
    isError: passesError,
  } = useQuery({
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
  useEffect(() => {
    if (isLoading || isError) return;
    const current = new Map(
      registrations.map((registration) => [registration.id, Boolean(registration.checked_in_at)]),
    );
    if (knownCheckIns.current) {
      const newlyConfirmed = registrations.find(
        (registration) =>
          registration.checked_in_at && knownCheckIns.current?.get(registration.id) === false,
      );
      if (newlyConfirmed) {
        setConfirmedPassId(newlyConfirmed.id);
        toast.success("Check-in confirmed", {
          description: newlyConfirmed.events?.title ?? "Your event pass is ready.",
        });
      }
    }
    knownCheckIns.current = current;
  }, [registrations, isLoading, isError]);

  useEffect(() => {
    if (!confirmedPassId) return;
    const timer = window.setTimeout(() => setConfirmedPassId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [confirmedPassId]);
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="My JESUP"
        title="Wallet"
        description="Your event credentials in one place."
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 pb-28 sm:px-6">
        {isLoading && (
          <div
            className="wallet-pass-skeleton space-y-4 border border-border/70 bg-card p-6"
            role="status"
          >
            <div className="h-4 w-28 bg-muted" />
            <div className="h-7 w-2/3 bg-muted" />
            <div className="h-52 w-52 bg-muted" />
            <span className="sr-only">Loading your credentials…</span>
          </div>
        )}
        {isError && (
          <p role="alert" className="text-sm text-destructive">
            Your credentials could not be loaded. Please try again.
          </p>
        )}
        {passesError && (
          <p role="alert" className="text-sm text-destructive">
            Other passes could not be loaded. Please try again.
          </p>
        )}
        {!isLoading &&
          !isError &&
          !passesLoading &&
          !passesError &&
          registrations.length === 0 &&
          passes.length === 0 && (
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
            className={`wallet-pass overflow-hidden border border-border/70 bg-card shadow-[var(--shadow-soft)] ${confirmedPassId === registration.id ? "wallet-pass--confirmed" : ""}`}
          >
            <div className="wallet-pass-top grad-jesup relative p-6 text-white sm:p-8">
              <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                    JESUP · Digital Extension Wagon
                  </p>
                  <p className="mt-1 text-xs text-white/70">Event credential</p>
                </div>
                <span className="border border-white/35 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  {registration.checked_in_at
                    ? "Checked in"
                    : registration.status === "waiting_list"
                      ? "Waitlisted"
                      : "Ready to check in"}
                </span>
              </div>
              <h2 className="relative z-10 mt-8 max-w-xl text-2xl font-black tracking-tight sm:text-3xl">
                {registration.events?.title ?? "Event"}
              </h2>
              <div className="relative z-10 mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
                {registration.events?.starts_at && (
                  <p className="flex items-center gap-2">
                    <Clock3 className="size-4" aria-hidden="true" />
                    {fmtDateTime(registration.events.starts_at)}
                  </p>
                )}
                {registration.events?.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4" aria-hidden="true" />
                    {registration.events.location}
                  </p>
                )}
              </div>
            </div>
            <div className="wallet-pass-bottom p-6 text-center sm:p-8">
              <div
                className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold"
                role="status"
                aria-live="polite"
              >
                {registration.checked_in_at ? (
                  <>
                    <CheckCircle2
                      className="size-5 text-emerald-700 dark:text-emerald-400"
                      aria-hidden="true"
                    />{" "}
                    Checked in · {fmtDateTime(registration.checked_in_at)}
                  </>
                ) : registration.status === "waiting_list" ? (
                  <span>
                    Waitlisted · your credential will appear when your place is confirmed.
                  </span>
                ) : (
                  <>
                    <QrCode className="size-5" aria-hidden="true" /> Present this code at check-in
                  </>
                )}
              </div>
              {registration.ticket_code && registration.status !== "waiting_list" ? (
                <>
                  <div className="mx-auto w-fit border border-border bg-white p-4 shadow-sm">
                    <QRCodeSVG
                      value={registration.ticket_code}
                      size={220}
                      level="M"
                      marginSize={1}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep this pass ready for event staff and eligible entitlements.
                  </p>
                  <details className="mx-auto mt-5 max-w-md border-t border-border pt-4 text-left">
                    <summary className="cursor-pointer text-sm font-bold">Pass details</summary>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Credential code</dt>
                        <dd className="break-all font-mono text-xs">{registration.ticket_code}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Check-in status</dt>
                        <dd className="font-semibold">
                          {registration.checked_in_at
                            ? `Checked in ${fmtDateTime(registration.checked_in_at)}`
                            : "Ready to check in"}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </>
              ) : registration.status === "waiting_list" ? (
                <p className="text-sm text-muted-foreground">
                  Your credential will appear once your place is confirmed.
                </p>
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
