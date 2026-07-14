import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { EmptyState, LoadingState, QueryErrorState } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchAdminEvents } from "@/lib/events";
import {
  approveGallerySubmission,
  GALLERY_SUBMISSION_STATUS_LABELS,
  listGallerySubmissions,
  rejectGallerySubmission,
  type GallerySubmission,
  type GallerySubmissionStatus,
} from "@/lib/event-gallery";
import {
  adminEventGalleryQueryKey,
  adminGallerySubmissionsQueryKey,
  eventGallerySummaryQueryKey,
  MY_GALLERY_SUBMISSIONS_QUERY_KEY,
  pendingGallerySubmissionsQueryKey,
  publicEventGalleryQueryKey,
} from "@/lib/query-config";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Check, ImageIcon, Loader2, X } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/events/gallery")({
  component: AdminGalleryModerationPage,
});

function invalidateAfterModeration(qc: ReturnType<typeof useQueryClient>, eventId: string) {
  void qc.invalidateQueries({ queryKey: adminGallerySubmissionsQueryKey() });
  void qc.invalidateQueries({ queryKey: pendingGallerySubmissionsQueryKey() });
  void qc.invalidateQueries({ queryKey: pendingGallerySubmissionsQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: adminEventGalleryQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: publicEventGalleryQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: eventGallerySummaryQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: MY_GALLERY_SUBMISSIONS_QUERY_KEY });
}

function AdminGalleryModerationPage() {
  const qc = useQueryClient();
  const { eventId: searchEventId } = Route.useSearch();
  const [eventFilter, setEventFilter] = useState(searchEventId ?? "all");
  const [statusFilter, setStatusFilter] = useState<GallerySubmissionStatus | "all">("pending");
  const [preview, setPreview] = useState<GallerySubmission | null>(null);
  const [reviewing, setReviewing] = useState<GallerySubmission | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editAltText, setEditAltText] = useState("");

  const filters = useMemo(
    () => ({
      eventId: eventFilter === "all" ? undefined : eventFilter,
      status: statusFilter,
    }),
    [eventFilter, statusFilter],
  );

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: fetchAdminEvents,
  });

  const {
    data: submissions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: adminGallerySubmissionsQueryKey(filters),
    queryFn: () =>
      listGallerySubmissions({
        eventId: filters.eventId,
        status: filters.status,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (submission: GallerySubmission) =>
      approveGallerySubmission(submission.id, {
        caption: editCaption.trim() || null,
        altText: editAltText.trim() || null,
      }),
    onSuccess: (_data, submission) => {
      invalidateAfterModeration(qc, submission.eventId);
      setReviewing(null);
      toast.success("Submission approved");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: (submissionId: string) => rejectGallerySubmission(submissionId),
    onSuccess: (_data, submissionId) => {
      const submission = submissions.find((s) => s.id === submissionId);
      if (submission) invalidateAfterModeration(qc, submission.eventId);
      setReviewing(null);
      toast.success("Submission rejected");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Rejection failed"),
  });

  function openReview(submission: GallerySubmission) {
    setReviewing(submission);
    setEditCaption(submission.caption ?? "");
    setEditAltText(submission.altText ?? "");
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Gallery submissions"
        description="Review participant photo submissions before they appear publicly."
        actions={
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="event-filter">Event</Label>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger id="event-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as GallerySubmissionStatus | "all")}>
            <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <LoadingState label="Loading submissions…" />}
      {isError && <QueryErrorState title="Couldn't load submissions" onRetry={() => refetch()} />}

      {!isLoading && !isError && submissions.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title="No submissions"
          description="Participant photo submissions will appear here for review."
        />
      )}

      {!isLoading && !isError && submissions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="space-y-3 p-4">
                <button
                  type="button"
                  className="block w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setPreview(submission)}
                  aria-label={`Preview submission for ${submission.eventTitle ?? "event"}`}
                >
                  <img
                    src={submission.imageUrl}
                    alt={submission.altText ?? submission.caption ?? ""}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </button>
                <div>
                  <p className="font-medium">{submission.eventTitle ?? "Event"}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted {fmtDateTime(submission.createdAt)}
                  </p>
                  {submission.caption && <p className="mt-1 text-sm">{submission.caption}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{GALLERY_SUBMISSION_STATUS_LABELS[submission.status]}</Badge>
                  {submission.hasPermissionConfirmed && (
                    <Badge variant="outline">Permission confirmed</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {submission.submitterName ?? "Participant"}
                  {submission.submitterEmail ? ` · ${submission.submitterEmail}` : ""}
                </p>
                {submission.status === "pending" && (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="lg" className="min-h-11 flex-1" onClick={() => openReview(submission)}>
                      <Check className="h-4 w-4" />
                      Review
                    </Button>
                  </div>
                )}
                {submission.status !== "pending" && submission.reviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed {fmtDateTime(submission.reviewedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.eventTitle ?? "Submission preview"}</DialogTitle>
          </DialogHeader>
          {preview && (
            <img
              src={preview.imageUrl}
              alt={preview.altText ?? preview.caption ?? "Submitted photo"}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review submission</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4">
              <img
                src={reviewing.imageUrl}
                alt={reviewing.altText ?? reviewing.caption ?? ""}
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
              <p className="text-sm text-muted-foreground">
                From {reviewing.submitterName ?? "participant"}
                {reviewing.submitterEmail ? ` (${reviewing.submitterEmail})` : ""}
              </p>
              <div>
                <Label htmlFor="review-caption">Caption</Label>
                <Textarea
                  id="review-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="review-alt">Alt text</Label>
                <Input
                  id="review-alt"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                />
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="min-h-11 flex-1"
                  disabled={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate(reviewing.id)}
                >
                  {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Reject
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="min-h-11 flex-1"
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(reviewing)}
                >
                  {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
