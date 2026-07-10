import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppButton } from "@/components/design-system";
import { useAuth } from "@/hooks/use-auth";
import {
  getEvaluationAvailability,
  getEventEvaluation,
} from "@/lib/evaluations";
import { eventEvaluationQueryKey } from "@/lib/query-config";
import type { EventDetail } from "@/lib/events";

type EvaluationCtaProps = {
  event: EventDetail;
};

export function EvaluationCta({ event }: EvaluationCtaProps) {
  const { user } = useAuth();

  const { data: evaluation } = useQuery({
    queryKey: eventEvaluationQueryKey(event.id),
    queryFn: () => getEventEvaluation(event.id),
  });

  if (event.status !== "published" || !event.isActive) return null;

  const availability = getEvaluationAvailability(evaluation ?? null, {
    isAuthenticated: !!user,
  });

  if (availability === "unavailable" || availability === "inactive") {
    if (event.survey?.isActive && event.survey.qualtricsUrl) {
      return (
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-token-soft">
          <h2 className="text-xl font-black text-foreground">{event.survey.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Share your feedback after attending this event.</p>
          <AppButton variant="primary" size="lg" shape="pill" className="mt-4" asChild>
            <a href={event.survey.qualtricsUrl} target="_blank" rel="noreferrer">
              Open Qualtrics evaluation
            </a>
          </AppButton>
        </div>
      );
    }
    return null;
  }

  if (availability === "not_open") {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-token-soft">
        <h2 className="text-xl font-black text-foreground">{evaluation?.title ?? "Event evaluation"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Evaluation opens {evaluation?.opensAt ? new Date(evaluation.opensAt).toLocaleString() : "soon"}.
        </p>
      </div>
    );
  }

  if (availability === "closed") {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-token-soft">
        <h2 className="text-xl font-black text-foreground">{evaluation?.title ?? "Event evaluation"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Evaluation closed.</p>
      </div>
    );
  }

  if (availability === "qualtrics" && evaluation?.qualtricsUrl) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-token-soft">
        <h2 className="text-xl font-black text-foreground">{evaluation.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Share your feedback after attending this event.</p>
        <AppButton variant="primary" size="lg" shape="pill" className="mt-4" asChild>
          <a href={evaluation.qualtricsUrl} target="_blank" rel="noreferrer">
            Open Qualtrics evaluation
          </a>
        </AppButton>
      </div>
    );
  }

  if (availability === "login_required") {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-token-soft">
        <h2 className="text-xl font-black text-foreground">{evaluation?.title ?? "Event evaluation"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to complete this evaluation.</p>
        <AppButton variant="primary" size="lg" shape="pill" className="mt-4" asChild>
          <Link to="/auth" search={{ next: `/events/${event.id}/evaluation` }}>
            Sign in to complete evaluation
          </Link>
        </AppButton>
      </div>
    );
  }

  if (availability === "native" && evaluation) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-token-soft">
        <h2 className="text-xl font-black text-foreground">{evaluation.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {evaluation.isRequired ? "Required evaluation" : "Optional evaluation"} ·{" "}
          {evaluation.responseMode === "anonymous" ? "Anonymous responses" : "Identified responses"}
        </p>
        <AppButton variant="primary" size="lg" shape="pill" className="mt-4" asChild>
          <Link to="/events/$id/evaluation" params={{ id: event.id }}>
            Complete evaluation
          </Link>
        </AppButton>
      </div>
    );
  }

  return null;
}
