import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatInTimeZone } from "date-fns-tz";
import { Download, FileText } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getPresenterDownloadUrl,
  getPresenterStaffBoard,
} from "@/lib/presenter-submissions.functions";
import {
  PRESENTER_FILE_KINDS,
  PRESENTER_KIND_LABELS,
  formatFileSize,
} from "@/lib/presenter-submissions";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/events/$id/presentations")({
  head: () =>
    listPageHead({
      title: "Presentation Files",
      description: "Event staff dashboard for presenter submission files.",
      path: "/events",
    }),
  component: PresenterStaffBoardPage,
});

function PresenterStaffBoardPage() {
  const { id } = Route.useParams();
  const board = useServerFn(getPresenterStaffBoard);
  const download = useServerFn(getPresenterDownloadUrl);

  const { data: event } = useQuery({
    queryKey: ["presenter-event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, timezone")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data, isPending, error } = useQuery({
    queryKey: ["presenter-staff-board", id],
    queryFn: () => board({ data: { eventId: id } }),
    retry: false,
  });

  const timezone = event?.timezone ?? "America/Chicago";
  const closesAt = data?.settings?.closesAt ?? null;
  const closesMs = closesAt ? new Date(closesAt).getTime() : null;
  const sessionTitles = new Map((data?.sessions ?? []).map((s: any) => [s.id, s.title]));

  async function downloadFile(submissionId: string) {
    try {
      const { url } = await download({ data: { submissionId } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download file");
    }
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Event staff"
        title={`Presentation files${event ? ` · ${event.title}` : ""}`}
        description={
          closesAt
            ? `Submission deadline: ${formatInTimeZone(closesAt, timezone, "MMMM d, yyyy · h:mm a zzz")}`
            : "Latest presenter files for presentation laptops."
        }
      />
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {isPending && <p role="status" className="text-muted-foreground">Loading presenter files…</p>}
        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="font-semibold">Event staff access required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This dashboard is limited to assigned event staff and administrators.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/events/$id/hub" params={{ id }}>Back to event</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {data && data.presenters.length === 0 && (
          <p className="text-muted-foreground">No presenters have been assigned for this event yet.</p>
        )}
        {data?.presenters.map((presenter: any) => {
          const files = data.submissions.filter(
            (s: any) => s.presenter_id === presenter.id && s.is_current,
          );
          return (
            <Card key={presenter.id}>
              <CardContent className="space-y-3 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-primary">
                      {presenter.display_name ||
                        presenter.profile?.full_name ||
                        presenter.profile?.email ||
                        "Presenter"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {presenter.presenter_type === "faculty" ? "Faculty" : "Student"}
                      {presenter.session_id && sessionTitles.get(presenter.session_id)
                        ? ` · ${sessionTitles.get(presenter.session_id)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="divide-y rounded-xl border border-border">
                  {PRESENTER_FILE_KINDS.map((kind) => {
                    const file = files.find((s: any) => s.kind === kind);
                    const late =
                      file && closesMs !== null && new Date(file.created_at).getTime() > closesMs;
                    return (
                      <div key={kind} className="flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{PRESENTER_KIND_LABELS[kind]}</p>
                            {file ? (
                              <p className="truncate text-xs text-muted-foreground">
                                {file.file_name} · {formatFileSize(file.file_size)} ·{" "}
                                {new Date(file.created_at).toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">No file submitted</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {late && <Badge variant="destructive">Late</Badge>}
                          {!file && <Badge variant="secondary">Missing</Badge>}
                          {file && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void downloadFile(file.id)}
                            >
                              <Download className="h-4 w-4" /> Download
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {data && data.access.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-lg font-semibold text-primary">Recent file access</h2>
              <div className="mt-3 divide-y">
                {data.access.map((entry: any) => (
                  <div key={entry.id} className="py-2 text-sm">
                    <span className="font-semibold capitalize">{entry.action}</span>
                    <span className="text-muted-foreground">
                      {" "}· {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
