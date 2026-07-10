import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { AppButton, LoadingState, QueryErrorState } from "@/components/design-system";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import {
  formatInquiryReference,
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_LABELS,
  listMyInquiries,
} from "@/lib/inquiries";
import { DemographicForm } from "@/components/demographics";
import {
  buildEmptyDemographicForm,
  hasAnyDemographicField,
  submitMyParticipantDemographics,
  type DemographicFormData,
} from "@/lib/demographics";
import {
  GALLERY_SUBMISSION_STATUS_LABELS,
  listMyGallerySubmissions,
} from "@/lib/event-gallery";
import {
  demographicCompletionQueryKey,
  eventDemographicAggregatesQueryKey,
  MY_GALLERY_SUBMISSIONS_QUERY_KEY,
  MY_INQUIRIES_QUERY_KEY,
  MY_COMPLETED_EVALUATIONS_QUERY_KEY,
  MY_PENDING_EVALUATIONS_QUERY_KEY,
} from "@/lib/query-config";
import {
  EVALUATION_RESPONSE_MODE_LABELS,
  getMyCompletedEvaluations,
  getMyPendingEvaluations,
} from "@/lib/evaluations";
import { toast } from "sonner";
import { ProfileInstitutionForm } from "@/components/profile/profile-institution-form";

export const Route = createFileRoute("/_authenticated/me")({ component: MePage });

function MePage() {
  const { user } = useAuth();
  const { data: regs } = useQuery({
    queryKey: ["my-regs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("event_registrations")
        .select("id, notes, created_at, events(id,title,starts_at,location)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: apps } = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("internship_applications")
        .select("id,status,created_at,internships(id,title,department)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: cos } = useQuery({
    queryKey: ["my-checkouts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("equipment_checkouts")
        .select("id,quantity,checkout_date,return_date,status,equipment(id,name)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const {
    data: inquiries = [],
    isLoading: inquiriesLoading,
    isError: inquiriesError,
    refetch: refetchInquiries,
  } = useQuery({
    queryKey: [...MY_INQUIRIES_QUERY_KEY, user?.id],
    enabled: !!user,
    queryFn: () => listMyInquiries(user!.id),
  });

  const { data: pendingEvaluations = [] } = useQuery({
    queryKey: [...MY_PENDING_EVALUATIONS_QUERY_KEY, user?.id],
    enabled: !!user,
    queryFn: () => getMyPendingEvaluations(user!.id),
  });
  const { data: completedEvaluations = [] } = useQuery({
    queryKey: [...MY_COMPLETED_EVALUATIONS_QUERY_KEY, user?.id],
    enabled: !!user,
    queryFn: () => getMyCompletedEvaluations(user!.id),
  });
  const { data: photoSubmissions = [] } = useQuery({
    queryKey: [...MY_GALLERY_SUBMISSIONS_QUERY_KEY, user?.id],
    enabled: !!user,
    queryFn: () => listMyGallerySubmissions(user!.id),
  });

  return (
    <PublicLayout>
      <PageHeader title="My Activity" description={user?.email ?? undefined} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Tabs defaultValue="profile">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="regs">Event Registrations</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="photos">Photo Submissions</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="apps">Internship Applications</TabsTrigger>
            <TabsTrigger value="cos">Equipment Checkouts</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <ProfileInstitutionForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="regs" className="mt-4 space-y-3">
            {(!regs || regs.length === 0) && <p className="text-muted-foreground">No registrations yet.</p>}
            {regs?.map((r: any) => (
              <RegistrationDemographicsCard key={r.id} registrationId={r.id} event={r.events} />
            ))}
          </TabsContent>
          <TabsContent value="evaluations" className="mt-4 space-y-6">
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-semibold text-primary">Pending evaluations</h3>
              {pendingEvaluations.length === 0 && (
                <p className="text-muted-foreground">No pending evaluations.</p>
              )}
              {pendingEvaluations.map((item) => (
                <Card key={`${item.evaluationId}-pending`}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{item.eventTitle}</div>
                      <p className="text-sm text-muted-foreground">{item.evaluationTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.isRequired ? "Required" : "Optional"} · {EVALUATION_RESPONSE_MODE_LABELS[item.responseMode]}
                        {item.closesAt ? ` · Closes ${fmtDateTime(item.closesAt)}` : ""}
                      </p>
                    </div>
                    <AppButton variant="primary" shape="pill" asChild>
                      <Link to="/events/$id/evaluation" params={{ id: item.eventId }}>
                        Complete evaluation
                      </Link>
                    </AppButton>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-semibold text-primary">Completed evaluations</h3>
              {completedEvaluations.length === 0 && (
                <p className="text-muted-foreground">No completed evaluations yet.</p>
              )}
              {completedEvaluations.map((item) => (
                <Card key={`${item.evaluationId}-completed`}>
                  <CardContent className="p-4">
                    <div className="font-medium">{item.eventTitle}</div>
                    <p className="text-sm text-muted-foreground">{item.evaluationTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed {fmtDateTime(item.completedAt)} · {EVALUATION_RESPONSE_MODE_LABELS[item.responseMode]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="photos" className="mt-4 space-y-3">
            {photoSubmissions.length === 0 && (
              <p className="text-muted-foreground">No photo submissions yet.</p>
            )}
            {photoSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <img
                    src={submission.imageUrl}
                    alt={submission.altText ?? submission.caption ?? ""}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <Link
                      to="/events/$id"
                      params={{ id: submission.eventId }}
                      className="font-medium text-primary hover:underline"
                    >
                      {submission.eventTitle ?? "Event"}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Submitted {fmtDateTime(submission.createdAt)}
                    </p>
                    {submission.caption && (
                      <p className="text-sm text-muted-foreground">{submission.caption}</p>
                    )}
                  </div>
                  <Badge>{GALLERY_SUBMISSION_STATUS_LABELS[submission.status]}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="inquiries" className="mt-4 space-y-3">
            {inquiriesLoading && <LoadingState label="Loading your inquiries…" />}
            {inquiriesError && (
              <QueryErrorState title="Couldn't load inquiries" onRetry={() => refetchInquiries()} />
            )}
            {!inquiriesLoading && !inquiriesError && inquiries.length === 0 && (
              <p className="text-muted-foreground">
                No linked inquiries yet.{" "}
                <Link to="/join" className="text-primary hover:underline">
                  Submit a join/connect inquiry
                </Link>
                .
              </p>
            )}
            {!inquiriesLoading && !inquiriesError && inquiries.map((inquiry) => (
              <Card key={inquiry.id}>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-serif text-lg font-semibold text-primary">
                      {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ref {formatInquiryReference(inquiry.id)} · Submitted {fmtDate(inquiry.submittedAt)}
                    </p>
                    {inquiry.programName && (
                      <p className="text-sm text-muted-foreground">Program: {inquiry.programName}</p>
                    )}
                  </div>
                  <Badge>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="apps" className="mt-4 space-y-3">
            {(!apps || apps.length === 0) && <p className="text-muted-foreground">No applications yet.</p>}
            {apps?.map((a: any) => (
              <Card key={a.id}><CardContent className="p-4 flex items-center justify-between gap-2">
                <div>
                  <div className="font-serif text-lg font-semibold text-primary">{a.internships.title}</div>
                  <p className="text-sm text-muted-foreground">{a.internships.department} · {fmtDate(a.created_at)}</p>
                </div>
                <Badge>{a.status}</Badge>
              </CardContent></Card>
            ))}
          </TabsContent>
          <TabsContent value="cos" className="mt-4 space-y-3">
            {(!cos || cos.length === 0) && <p className="text-muted-foreground">No checkouts yet.</p>}
            {cos?.map((c: any) => (
              <Card key={c.id}><CardContent className="p-4 flex items-center justify-between gap-2">
                <div>
                  <div className="font-serif text-lg font-semibold text-primary">{c.equipment.name}</div>
                  <p className="text-sm text-muted-foreground">Qty {c.quantity} · {fmtDate(c.checkout_date)} → {fmtDate(c.return_date)}</p>
                </div>
                <Badge>{c.status}</Badge>
              </CardContent></Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PublicLayout>
  );
}

function RegistrationDemographicsCard({
  registrationId,
  event,
}: {
  registrationId: string;
  event: { id: string; title: string; starts_at: string; location: string | null };
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DemographicFormData>(buildEmptyDemographicForm());

  async function saveDemographics() {
    if (!hasAnyDemographicField(form)) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      await submitMyParticipantDemographics("registration", registrationId, form);
      toast.success("Demographic information saved");
      void qc.invalidateQueries({
        queryKey: demographicCompletionQueryKey("registration", registrationId),
      });
      void qc.invalidateQueries({ queryKey: eventDemographicAggregatesQueryKey(event.id) });
      setOpen(false);
      setForm(buildEmptyDemographicForm());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save demographics");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <Link
          to="/events/$id"
          params={{ id: event.id }}
          className="font-serif text-lg font-semibold text-primary hover:underline"
        >
          {event.title}
        </Link>
        <p className="text-sm text-muted-foreground">
          {fmtDateTime(event.starts_at)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          Optional demographics: submission status is not displayed for privacy. You may update your responses at any time.
        </p>
        {!open ? (
          <AppButton variant="outline" size="sm" shape="pill" onClick={() => setOpen(true)}>
            Update optional demographics
          </AppButton>
        ) : (
          <div className="space-y-3">
            <DemographicForm value={form} onChange={setForm} idPrefix={`me-reg-${registrationId}`} />
            <div className="flex flex-wrap gap-2">
              <AppButton variant="primary" size="sm" shape="pill" onClick={() => void saveDemographics()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </AppButton>
              <AppButton variant="outline" size="sm" shape="pill" onClick={() => setOpen(false)}>
                Cancel
              </AppButton>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
