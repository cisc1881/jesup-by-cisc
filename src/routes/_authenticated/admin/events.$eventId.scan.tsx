import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, QrCode } from "lucide-react";
import { QrTicketScanner } from "@/components/admin/qr-ticket-scanner";
import { fetchEventById } from "@/lib/events";
import { productDb } from "@/lib/product-db";

export const Route = createFileRoute("/_authenticated/admin/events/$eventId/scan")({
  component: EventScanPage,
});

const purposes = [
  ["entry", "Event entry"],
  ["session", "Session attendance"],
  ["workshop", "Workshop completion"],
  ["parking", "Parking pass"],
  ["exhibitor", "Exhibitor visit"],
  ["contact", "Contact exchange"],
  ["certificate", "Certificate eligibility"],
  ["vip", "VIP privilege"],
  ["badge_print", "Badge printing"],
] as const;

function EventScanPage() {
  const { eventId } = Route.useParams();
  const [purpose, setPurpose] = useState<string>("entry");
  const [targetId, setTargetId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ name: string; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: event } = useQuery({
    queryKey: ["scan-event", eventId],
    queryFn: () => fetchEventById(eventId),
  });

  async function scan(value: string) {
    if (busy || !value.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const { data, error: scanError } = await productDb.rpc("scan_jesup_credential", {
      p_event_id: eventId,
      p_code: value.trim(),
      p_purpose: purpose,
      p_target_id: targetId || null,
    });
    setBusy(false);
    if (scanError) {
      setError(
        scanError.code === "23505"
          ? "This credential was already scanned for this purpose."
          : scanError.message,
      );
      return;
    }
    const accepted = data?.[0];
    if (!accepted) {
      setError("No scan result was returned.");
      return;
    }
    setResult({ name: accepted.attendee_name, time: accepted.scanned_at });
    setCode("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Organizer tools
        </p>
        <h1 className="mt-2 text-3xl font-black">QR scanning</h1>
        <p className="mt-2 text-sm text-muted-foreground">{event?.title ?? "Event"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Meal service uses the dedicated meal redemption scanner to enforce daily allowances.
        </p>
      </header>
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <label className="block text-sm font-bold">
          Scan purpose
          <select
            value={purpose}
            onChange={(event) => {
              setPurpose(event.target.value);
              setTargetId("");
              setResult(null);
            }}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          >
            {purposes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {(purpose === "session" || purpose === "workshop") && (
          <label className="block text-sm font-bold">
            Session
            <select
              required
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
            >
              <option value="">Choose a session</option>
              {event?.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <QrTicketScanner
          disabled={busy || ((purpose === "session" || purpose === "workshop") && !targetId)}
          onDetected={scan}
          continuous
        />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void scan(code);
          }}
          className="flex gap-2"
        >
          <label className="flex-1 text-sm font-bold">
            Enter code manually
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
            />
          </label>
          <button
            type="submit"
            disabled={
              busy ||
              !code.trim() ||
              ((purpose === "session" || purpose === "workshop") && !targetId)
            }
            className="self-end min-h-11 rounded-lg bg-primary px-4 font-bold text-primary-foreground disabled:opacity-50"
          >
            Verify
          </button>
        </form>
      </div>
      {result && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-green-500/40 bg-green-500/10 p-5"
        >
          <CheckCircle2 className="h-7 w-7 text-green-700" />
          <div>
            <p className="font-bold">Accepted: {result.name}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(result.time).toLocaleString()}
            </p>
          </div>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-5"
        >
          <QrCode className="h-6 w-6 text-destructive" />
          <p className="font-bold">{error}</p>
        </div>
      )}
      <Link
        to="/admin/events/$eventId/command"
        params={{ eventId }}
        className="inline-flex min-h-11 items-center font-bold underline"
      >
        Back to Event Command Center
      </Link>
    </div>
  );
}
