import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { EventDetail } from "@/lib/events";
import {
  fetchRegistrationSessionSelections,
  registerForEvent,
  saveRegistrationAccommodations,
  saveRegistrationSessionSelections,
} from "@/lib/events";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarPlus, ExternalLink, QrCode, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import { EventbriteCheckout } from "@/components/events/eventbrite-checkout";

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
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [foodAllergies, setFoodAllergies] = useState("");
  const [accessibilityAccommodations, setAccessibilityAccommodations] = useState("");
  const [accommodationConsent, setAccommodationConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demographicStep, setDemographicStep] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [demographicForm, setDemographicForm] = useState<DemographicFormData>(
    buildEmptyDemographicForm(),
  );
  const [savingDemographics, setSavingDemographics] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [sessionQuery, setSessionQuery] = useState("");
  const [savingSessions, setSavingSessions] = useState(false);
  const registrationProvider =
    event.metadata.registration_provider === "eventbrite" ? "eventbrite" : "jesup";
  const eventbriteEventId =
    typeof event.metadata.eventbrite_event_id === "string"
      ? event.metadata.eventbrite_event_id
      : "";
  const eventbriteEventUrl =
    typeof event.metadata.eventbrite_event_url === "string"
      ? event.metadata.eventbrite_event_url
      : "";
  const ticketPriceLabel =
    typeof event.metadata.ticket_price_label === "string"
      ? event.metadata.ticket_price_label
      : null;

  const canRegister =
    event.registrationStatus === "open" ||
    event.registrationStatus === "waiting_list" ||
    event.registrationStatus === "invite_only";

  const visibleSessions = useMemo(() => {
    const query = sessionQuery.trim().toLowerCase();
    return event.sessions.filter(
      (session) =>
        !query ||
        [session.title, session.description, session.location].some((value) =>
          value?.toLowerCase().includes(query),
        ),
    );
  }, [event.sessions, sessionQuery]);

  useEffect(() => {
    if (!registration?.id) return;
    fetchRegistrationSessionSelections(registration.id)
      .then(setSelectedSessionIds)
      .catch(() => undefined);
  }, [registration?.id]);

  function toggleSession(sessionId: string) {
    setSelectedSessionIds((current) =>
      current.includes(sessionId)
        ? current.filter((id) => id !== sessionId)
        : [...current, sessionId],
    );
  }

  async function updateSessionPlan(targetRegistrationId: string) {
    setSavingSessions(true);
    try {
      await saveRegistrationSessionSelections(targetRegistrationId, selectedSessionIds);
      toast.success("Your session agenda is saved");
      void qc.invalidateQueries({ queryKey: ["registration-session-plan", targetRegistrationId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Session choices could not be saved");
      throw error;
    } finally {
      setSavingSessions(false);
    }
  }

  async function handleRegister() {
    if (!user) {
      navigate({ to: "/auth", search: { next: `/events/${event.id}` } });
      return;
    }
    setBusy(true);
    try {
      const hasAccommodationDetails = Boolean(
        dietaryRestrictions.trim() || foodAllergies.trim() || accessibilityAccommodations.trim(),
      );
      if (hasAccommodationDetails && !accommodationConsent) {
        toast.error(
          "Please authorize JESUP to use these details to coordinate your accommodations.",
        );
        return;
      }
      const result = await registerForEvent(event.id, user.id, notes, inviteCode);
      if (selectedSessionIds.length > 0) {
        await saveRegistrationSessionSelections(result.id, selectedSessionIds);
      }
      if (hasAccommodationDetails) {
        try {
          await saveRegistrationAccommodations(result.id, {
            dietaryRestrictions: dietaryRestrictions.trim(),
            foodAllergies: foodAllergies.trim(),
            accessibilityAccommodations: accessibilityAccommodations.trim(),
            consent: accommodationConsent,
          });
        } catch {
          toast.warning(
            "Registration completed, but accommodation details could not be saved. Please contact the event team.",
          );
        }
      }
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
          {registrationProvider === "eventbrite" ? "Tickets" : "Registration"}
        </h2>
        {registrationProvider === "eventbrite" && eventbriteEventId && eventbriteEventUrl ? (
          <EventbriteCheckout
            eventId={eventbriteEventId}
            eventUrl={eventbriteEventUrl}
            priceLabel={ticketPriceLabel}
          />
        ) : registrationProvider === "eventbrite" ? (
          <p className="text-muted-foreground">
            Ticket checkout is being prepared. Please check back soon.
          </p>
        ) : registration ? (
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
            {event.sessions.length > 0 && (
              <SessionPlanner
                eventId={event.id}
                sessions={visibleSessions}
                totalSessions={event.sessions.length}
                query={sessionQuery}
                onQueryChange={setSessionQuery}
                selectedIds={selectedSessionIds}
                onToggle={toggleSession}
              />
            )}
            {event.sessions.length > 0 && (
              <AppButton
                variant="primary"
                size="sm"
                onClick={() => void updateSessionPlan(registration.id)}
                disabled={savingSessions}
              >
                {savingSessions ? "Saving agenda…" : "Save my session agenda"}
              </AppButton>
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
                <Label htmlFor={`event-${event.id}-invite-code`}>Invite code</Label>
                <Input
                  id={`event-${event.id}-invite-code`}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                />
              </div>
            )}
            {event.sessions.length > 0 && (
              <SessionPlanner
                eventId={event.id}
                sessions={visibleSessions}
                totalSessions={event.sessions.length}
                query={sessionQuery}
                onQueryChange={setSessionQuery}
                selectedIds={selectedSessionIds}
                onToggle={toggleSession}
              />
            )}
            <div>
              <Label htmlFor={`event-${event.id}-dietary`}>
                Dietary preferences or restrictions (optional)
              </Label>
              <Textarea
                id={`event-${event.id}-dietary`}
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="For example: vegetarian, halal, gluten-free"
              />
            </div>
            <div>
              <Label htmlFor={`event-${event.id}-allergies`}>Food allergies (optional)</Label>
              <Textarea
                id={`event-${event.id}-allergies`}
                value={foodAllergies}
                onChange={(e) => setFoodAllergies(e.target.value)}
                placeholder="List allergy and severity. For emergencies, contact the event team directly."
              />
            </div>
            <div>
              <Label htmlFor={`event-${event.id}-accessibility`}>
                Accessibility accommodations (optional)
              </Label>
              <Textarea
                id={`event-${event.id}-accessibility`}
                value={accessibilityAccommodations}
                onChange={(e) => setAccessibilityAccommodations(e.target.value)}
                placeholder="For example: wheelchair access, ASL interpretation, accessible seating"
              />
            </div>
            <div>
              <Label htmlFor={`event-${event.id}-registration-notes`}>
                Other registration notes (optional)
              </Label>
              <Textarea
                id={`event-${event.id}-registration-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-xl border p-3">
              <Checkbox
                id={`event-${event.id}-accommodation-consent`}
                checked={accommodationConsent}
                onCheckedChange={(value) => setAccommodationConsent(value === true)}
              />
              <Label
                htmlFor={`event-${event.id}-accommodation-consent`}
                className="text-sm font-normal leading-relaxed"
              >
                I authorize JESUP/CISC event staff to use the dietary, allergy, and accessibility
                details I provide solely to coordinate this event. I understand this form is not for
                emergency medical instructions.
              </Label>
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

type SessionPlannerProps = {
  eventId: string;
  sessions: EventDetail["sessions"];
  totalSessions: number;
  query: string;
  onQueryChange: (value: string) => void;
  selectedIds: string[];
  onToggle: (sessionId: string) => void;
};

function SessionPlanner({
  eventId,
  sessions,
  totalSessions,
  query,
  onQueryChange,
  selectedIds,
  onToggle,
}: SessionPlannerProps) {
  return (
    <fieldset className="border border-border bg-muted/20 p-4">
      <legend className="px-2 text-sm font-black">Plan the sessions you expect to attend</legend>
      <p className="mb-3 text-xs leading-5 text-muted-foreground">
        Your choices automatically appear in My Agenda. You can change them later.
      </p>
      {totalSessions > 6 && (
        <label className="mb-3 flex min-h-11 items-center gap-2 border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Filter registration sessions</span>
          <Input
            id={`event-${eventId}-session-search`}
            name="session_search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Find a session, room, or topic"
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </label>
      )}
      <div className="max-h-72 divide-y overflow-y-auto border bg-background">
        {sessions.map((session) => (
          <label
            key={session.id}
            className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50"
          >
            <Checkbox
              checked={selectedIds.includes(session.id)}
              onCheckedChange={() => onToggle(session.id)}
              aria-label={`Add ${session.title} to my agenda`}
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold">{session.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {[
                  session.startsAt ? new Date(session.startsAt).toLocaleString() : null,
                  session.location,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Time and room to be announced"}
              </span>
            </span>
          </label>
        ))}
        {sessions.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No sessions match your search.</p>
        )}
      </div>
      <p className="mt-3 text-xs font-bold text-primary">
        {selectedIds.length} session{selectedIds.length === 1 ? "" : "s"} selected
      </p>
    </fieldset>
  );
}
