import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer, AppButton } from "@/components/design-system";
import { NativeEvaluationForm } from "@/components/evaluations/native-evaluation-form";
import { useAuth } from "@/hooks/use-auth";
import { fetchEventById } from "@/lib/events";
import {
  getEvaluationAvailability,
  getEventEvaluation,
  listEvaluationQuestions,
} from "@/lib/evaluations";
import {
  adminEventAttendanceQueryKey,
  adminEventAttendanceSummaryQueryKey,
  evaluationQuestionsQueryKey,
  eventEvaluationQueryKey,
  MY_COMPLETED_EVALUATIONS_QUERY_KEY,
  MY_PENDING_EVALUATIONS_QUERY_KEY,
} from "@/lib/query-config";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/events/$id/evaluation")({
  loader: async ({ params }) => {
    const event = await fetchEventById(params.id);
    return { event };
  },
  component: EventEvaluationPage,
});

function EventEvaluationPage() {
  const { id } = Route.useParams();
  const { event } = Route.useLoaderData();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [completed, setCompleted] = useState(false);

  function handleCompleted() {
    setCompleted(true);
    void qc.invalidateQueries({ queryKey: MY_PENDING_EVALUATIONS_QUERY_KEY });
    void qc.invalidateQueries({ queryKey: MY_COMPLETED_EVALUATIONS_QUERY_KEY });
    void qc.invalidateQueries({ queryKey: adminEventAttendanceQueryKey(id) });
    void qc.invalidateQueries({ queryKey: adminEventAttendanceSummaryQueryKey(id) });
  }

  const { data: evaluation } = useQuery({
    queryKey: eventEvaluationQueryKey(id),
    queryFn: () => getEventEvaluation(id),
  });

  const { data: questions = [] } = useQuery({
    queryKey: evaluationQuestionsQueryKey(evaluation?.id ?? "none"),
    enabled: !!evaluation?.id && evaluation.useNativeForm,
    queryFn: () => listEvaluationQuestions(evaluation!.id),
  });

  const { data: attendanceId } = useQuery({
    queryKey: ["my-attendance-for-eval", id, user?.id],
    enabled: !!user && !!evaluation,
    queryFn: async () => {
      const { data: reg } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!reg?.id) return null;
      const { data: attendance } = await supabase
        .from("event_attendance")
        .select("id")
        .eq("event_id", id)
        .eq("registration_id", reg.id)
        .maybeSingle();
      return attendance?.id ?? null;
    },
  });

  if (!event) {
    return (
      <PublicLayout>
        <PageContainer size="md" className="py-16 text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
        </PageContainer>
      </PublicLayout>
    );
  }

  const availability = getEvaluationAvailability(evaluation ?? null, {
    isAuthenticated: !!user,
  });

  return (
    <PublicLayout>
      <PageContainer size="md" className="space-y-6 pb-bottom-nav md:pb-[var(--page-py)]">
        <AppButton variant="ghost" size="sm" shape="pill" className="w-fit" asChild>
          <Link to="/events/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
        </AppButton>

        {completed && (
          <div
            className="rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-token-soft"
            role="status"
            aria-live="polite"
          >
            <h1 className="text-2xl font-black text-foreground">Thank you</h1>
            <p className="mt-2 text-muted-foreground">Your evaluation has been submitted.</p>
          </div>
        )}

        {!completed && availability === "unavailable" && (
          <StateCard title="Evaluation unavailable" description="This event does not have an active evaluation." />
        )}

        {!completed && availability === "inactive" && (
          <StateCard title="Evaluation inactive" description="The evaluation for this event is not currently active." />
        )}

        {!completed && availability === "not_open" && (
          <StateCard
            title="Evaluation opens soon"
            description={
              evaluation?.opensAt
                ? `This evaluation opens on ${new Date(evaluation.opensAt).toLocaleString()}.`
                : "This evaluation is not open yet."
            }
          />
        )}

        {!completed && availability === "closed" && (
          <StateCard title="Evaluation closed" description="The evaluation period for this event has ended." />
        )}

        {!completed && availability === "login_required" && (
          <StateCard
            title="Sign in required"
            description="This evaluation requires you to sign in with the account you used to register."
            action={
              <AppButton variant="primary" shape="pill" asChild>
                <Link to="/auth" search={{ next: `/events/${id}/evaluation` }}>
                  Sign in
                </Link>
              </AppButton>
            }
          />
        )}

        {!completed && availability === "qualtrics" && evaluation?.qualtricsUrl && (
          <StateCard
            title={evaluation.title}
            description="This event uses an external Qualtrics evaluation."
            action={
              <AppButton variant="primary" size="lg" shape="pill" asChild>
                <a href={evaluation.qualtricsUrl} target="_blank" rel="noreferrer">
                  Open Qualtrics evaluation
                </a>
              </AppButton>
            }
          />
        )}

        {!completed && availability === "native" && evaluation && (
          <NativeEvaluationForm
            evaluation={evaluation}
            eventId={id}
            eventTitle={event.title}
            questions={questions}
            isAuthenticated={!!user}
            attendanceId={attendanceId}
            onCompleted={handleCompleted}
          />
        )}
      </PageContainer>
    </PublicLayout>
  );
}

function StateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-token-soft sm:p-8">
      <h1 className="text-2xl font-black text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
