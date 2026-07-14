import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { EventDetail } from "@/lib/events";
import { registerForEvent } from "@/lib/events";
import { triggerEmailDelivery } from "@/lib/email-delivery";
import { downloadEventIcs, googleMapsDirectionsUrl, shareEvent } from "@/lib/event-calendar";
import { useAuth } from "@/hooks/use-auth";
import { AppButton, AppCard } from "@/components/design-system";
import { DemographicForm } from "@/components/demographics";
import {
  buildEmptyDemographicForm,
  hasAnyDemographicField,
  submitMyParticipantDemographics,
  type DemographicFormData,
} from "@/lib/demographics";
import {
  demographicCompletionQueryKey,
  eventDemographicAggregatesQueryKey,
} from "@/lib/query-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus, ExternalLink, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";

type EventRegistrationPanelProps = {
  event: EventDetail;
  registration?: {
    id: string;
    status: string;
    ticket_code: string | null;
    checked_in_at: string | null;
    notes: string | null;
  } | null;
};

export function EventRegistrationPanel({ event, registration }: EventRegistrationPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [demographicStep, setDemographicStep] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [demographicForm, setDemographicForm] = useState<DemographicFormData>(
    buildEmptyDemographicForm(),
  );
  const [savingDemographics, setSavingDemographics] = useState(false);

  const canRegister =
    event.registrationStatus === "open" ||
    event.registrationStatus === "waiting_list" ||
    event.registrationStatus === "invite_only";

  async function handleRegister() {
    if (!user) {
      navigate({ to: "/auth", search: { next: `/events/${event.id}` } });
      return;
    }
    setBusy(true);
    try {
      const result = await registerForEvent(event.id, user.id, notes, inviteCode);
      triggerEmailDelivery();
      toast.success(
        result.status === "waiting_list" ? "Added to waiting list" : "You're registered!",
      );
      setRegistrationId(result.id);
      setDemographicStep(true);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["event-reg", event.id] }),
        qc.invalidateQueries({ queryKey: ["event-count", event.id] }),
        qc.invalidateQueries({ queryKey: ["events"] }),
        qc.invalidateQueries({ queryKey: ["my-regs", user.id] }),
        qc.invalidateQueries({ queryKey: ["command-center-dashboard"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDemographicSubmit() {
    if (!registrationId) return;
    if (!hasAnyDemographicField(demographicForm)) {
      setDemographicStep(false);
      return;
    }
    setSavingDemographics(true);
    try {
      await submitMyParticipantDemographics("registration", registrationId, demographicForm);
      toast.success("Demographic information saved");
      void qc.invalidateQueries({ queryKey: eventDemographicAggregatesQueryKey(event.id) });
      void qc.invalidateQueries({
        queryKey: demographicCompletionQueryKey("registration", registrationId),
      });
      setDemographicStep(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save demographics");
    } finally {
      setSavingDemographics(false);
    }
  }

  if (demographicStep && registrationId) {
    return (
      <div className="space-y-4">
        <AppCard variant="lift" padding="md" className="space-y-4">
          <h2 className="text-xl font-black tracking-[var(--tracking-tight)] text-foreground">
            Optional demographic information
          </h2>
          <p className="text-sm text-muted-foreground">
            Your registration is complete. You may share optional demographic information below or
            skip this step.
          </p>
          <DemographicForm
            value={demographicForm}
            onChange={setDemographicForm}
            idPrefix="reg-demo"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <AppButton
              variant="primary"
              size="lg"
              shape="pill"
              className="w-full"
              onClick={() => void handleDemographicSubmit()}
              disabled={savingDemographics}
            >
              {savingDemographics ? "Saving…" : "Save demographics"}
            </AppButton>
            <AppButton
              variant="outline"
              size="lg"
              shape="pill"
              className="w-full"
              onClick={() => setDemographicStep(false)}
            >
              Skip for now
            </AppButton>
          </div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AppCard variant="lift" padding="md" className="space-y-4">
        <h2 className="text-xl font-black tracking-[var(--tracking-tight)] text-foreground">
          Registration
        </h2>
        {registration ? (
          <div className="space-y-3">
            <p className="font-semibold text-green-700">
              {registration.status === "waiting_list"
                ? "You're on the waiting list."
                : "✓ You're registered."}
            </p>
            {registration.ticket_code && (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <QrCode className="h-4 w-4" />
                  Digital ticket
                </div>
                <p className="mt-2 font-mono text-lg font-bold tracking-widest text-foreground">
                  {registration.ticket_code}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Show this code at check-in.</p>
              </div>
            )}
            {registration.checked_in_at && (
              <p className="text-sm text-muted-foreground">
                Checked in {new Date(registration.checked_in_at).toLocaleString()}
              </p>
            )}
            <AppButton
              variant="outline"
              size="sm"
              shape="pill"
              onClick={() => {
                setRegistrationId(registration.id);
                setDemographicForm(buildEmptyDemographicForm());
                setDemographicStep(true);
              }}
            >
              Update optional demographics
            </AppButton>
          </div>
        ) : !canRegister ||
          event.registrationStatus === "closed" ||
          event.registrationStatus === "sold_out" ? (
          <p className="text-muted-foreground">Registration is closed for this event.</p>
        ) : event.spotsRemaining === 0 && event.registrationStatus !== "waiting_list" ? (
          <p className="text-muted-foreground">This event is at capacity.</p>
        ) : (
          <div className="space-y-3">
            {event.registrationStatus === "invite_only" && (
              <div>
                <Label>Invite code</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                />
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dietary restrictions, accessibility needs, etc."
              />
            </div>
            <AppButton
              variant="primary"
              size="lg"
              shape="pill"
              className="w-full"
              onClick={handleRegister}
              disabled={busy}
            >
              {busy ? "Registering…" : user ? "Register" : "Sign in to register"}
            </AppButton>
          </div>
        )}
      </AppCard>

      <div className="flex flex-wrap gap-3">
        <AppButton variant="outline" size="lg" shape="pill" onClick={() => downloadEventIcs(event)}>
          <CalendarPlus className="h-4 w-4" />
          Add to Calendar
        </AppButton>
        {(event.lat != null || event.location) && (
          <AppButton variant="outline" size="lg" shape="pill" asChild>
            <a href={googleMapsDirectionsUrl(event)} target="_blank" rel="noreferrer">
              Directions <ExternalLink className="h-4 w-4" />
            </a>
          </AppButton>
        )}
        <AppButton
          variant="outline"
          size="lg"
          shape="pill"
          onClick={async () => {
            try {
              await shareEvent(event);
              toast.success("Event link ready to share");
            } catch {
              toast.error("Could not share event");
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Share
        </AppButton>
      </div>
    </div>
  );
}
