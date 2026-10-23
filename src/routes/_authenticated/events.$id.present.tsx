import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatInTimeZone } from "date-fns-tz";
import { FileUp, FileText, Loader2, RefreshCw } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  confirmPresenterUpload,
  getPresenterDownloadUrl,
  getPresenterPortal,
  requestPresenterUploadUrl,
} from "@/lib/presenter-submissions.functions";
import {
  PRESENTER_FILES_BUCKET,
  PRESENTER_FILE_KINDS,
  PRESENTER_KIND_LABELS,
  formatFileSize,
  validatePresenterFile,
  type PresenterFileKind,
} from "@/lib/presenter-submissions";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/events/$id/present")({
  head: () =>
    listPageHead({
      title: "Presenter Submissions",
      description: "Upload your proposal and presentation files for this event.",
      path: "/events",
    }),
  component: PresenterPortalPage,
});

const WINDOW_LABELS = {
  disabled: "Submissions are not enabled for this event yet.",
  "not-open": "Submissions have not opened yet.",
  open: "Submissions are open.",
  closed: "The submission deadline has passed.",
} as const;

function PresenterPortalPage() {
  const { id } = Route.useParams();
  const portal = useServerFn(getPresenterPortal);
  const requestUrl = useServerFn(requestPresenterUploadUrl);
  const confirm = useServerFn(confirmPresenterUpload);
  const download = useServerFn(getPresenterDownloadUrl);
  const qc = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["presenter-event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, timezone, starts_at")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data, isPending, error } = useQuery({
    queryKey: ["presenter-portal", id],
    queryFn: () => portal({ data: { eventId: id } }),
    retry: false,
  });

  const timezone = event?.timezone ?? "America/Chicago";
  const settings = data?.settings ?? null;
  const windowStatus = data?.window ?? "disabled";
  const open = windowStatus === "open";

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
        eyebrow="Presenter portal"
        title={event?.title ?? "Presenter submissions"}
        description={
          settings?.closesAt
            ? `Deadline: ${formatInTimeZone(settings.closesAt, timezone, "MMMM d, yyyy · h:mm a zzz")}`
            : "Upload your proposal and presentation files."
        }
      />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        {isPending && <p role="status" className="text-muted-foreground">Loading your presenter access…</p>}
        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="font-semibold">Presenter access required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This area is for invited student and faculty presenters. If you believe you should
                have access, contact the event team.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/events/$id/hub" params={{ id }}>Back to event</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {data && (
          <>
            <Card>
              <CardContent className="space-y-2 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={open ? "default" : "secondary"}>{WINDOW_LABELS[windowStatus]}</Badge>
                  {settings?.opensAt && windowStatus === "not-open" && (
                    <span className="text-sm text-muted-foreground">
                      Opens {formatInTimeZone(settings.opensAt, timezone, "MMMM d, yyyy · h:mm a zzz")}
                    </span>
                  )}
                </div>
                {settings?.instructions && (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{settings.instructions}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  You can replace a file any time before the deadline. Only the event team can see
                  your files.
                </p>
              </CardContent>
            </Card>
            {PRESENTER_FILE_KINDS.map((kind) => (
              <SubmissionCard
                key={kind}
                kind={kind}
                eventId={id}
                open={open}
                settings={settings}
                submissions={data.submissions.filter((s) => s.kind === kind)}
                onDownload={downloadFile}
                onUploaded={() => qc.invalidateQueries({ queryKey: ["presenter-portal", id] })}
                requestUrl={requestUrl}
                confirm={confirm}
              />
            ))}
          </>
        )}
      </div>
    </PublicLayout>
  );
}

type Submission = {
  id: string;
  kind: string;
  title: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_current: boolean;
  created_at: string;
};

function SubmissionCard({
  kind,
  eventId,
  open,
  settings,
  submissions,
  onDownload,
  onUploaded,
  requestUrl,
  confirm,
}: {
  kind: PresenterFileKind;
  eventId: string;
  open: boolean;
  settings: { allowedMimeTypes: string[]; maxFileBytes: number } | null;
  submissions: Submission[];
  onDownload: (submissionId: string) => void;
  onUploaded: () => void;
  requestUrl: ReturnType<typeof useServerFn<typeof requestPresenterUploadUrl>>;
  confirm: ReturnType<typeof useServerFn<typeof confirmPresenterUpload>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const current = submissions.find((s) => s.is_current);
  const history = submissions.filter((s) => !s.is_current);

  async function upload(file: File) {
    if (!settings) return;
    const validation = validatePresenterFile(file, settings);
    if (validation) {
      toast.error(validation);
      return;
    }
    setBusy(true);
    try {
      const { path, token } = await requestUrl({
        data: { eventId, kind, fileName: file.name, fileSize: file.size, mimeType: file.type },
      });
      const { error: uploadError } = await supabase.storage
        .from(PRESENTER_FILES_BUCKET)
        .uploadToSignedUrl(path, token, file);
      if (uploadError) throw uploadError;
      await confirm({
        data: {
          eventId,
          kind,
          title: file.name,
          filePath: path,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      });
      toast.success(current ? "File replaced" : "File uploaded");
      onUploaded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-primary">{PRESENTER_KIND_LABELS[kind]}</h2>
          {current ? <Badge>Submitted</Badge> : <Badge variant="secondary">Missing</Badge>}
        </div>
        {current && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{current.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(current.file_size)} · uploaded{" "}
                  {new Date(current.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onDownload(current.id)}>
              Download
            </Button>
          </div>
        )}
        {history.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {history.length} earlier version{history.length === 1 ? "" : "s"} replaced.
          </p>
        )}
        {open && (
          <div className="space-y-2">
            <Label htmlFor={`upload-${kind}`}>{current ? "Replace file" : "Upload file"}</Label>
            <div className="flex items-center gap-2">
              <Input
                id={`upload-${kind}`}
                ref={inputRef}
                type="file"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : current ? (
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileUp className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {settings && (
              <p className="text-xs text-muted-foreground">
                Accepted: {settings.allowedMimeTypes.includes("application/pdf") ? "PDF" : ""}
                {settings.allowedMimeTypes.some((m) => m.includes("presentation") || m.includes("powerpoint"))
                  ? ", PowerPoint"
                  : ""}{" "}
                · max {Math.round(settings.maxFileBytes / (1024 * 1024))} MB
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
