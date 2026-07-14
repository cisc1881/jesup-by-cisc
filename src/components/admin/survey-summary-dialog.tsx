import { useState } from "react";
import { ClipboardCheck, Copy, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeSurveyCsv, type SanitizedSurveyCsv } from "@/modules/ai/survey-csv";
import { summarizeSurveyServerFn } from "@/modules/ai/survey-summary-server-fn";

type SummaryResult = Awaited<ReturnType<typeof summarizeSurveyServerFn>>;

export function SurveySummaryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [surveyTitle, setSurveyTitle] = useState("");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<SanitizedSurveyCsv | null>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [generating, setGenerating] = useState(false);

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 100_000) {
      toast.error("CSV must be 100 KB or smaller.");
      return;
    }
    try {
      const text = await file.text();
      const sanitized = sanitizeSurveyCsv(text);
      setCsvText(text);
      setFileName(file.name);
      setPreview(sanitized);
      setResult(null);
      if (!surveyTitle) setSurveyTitle(file.name.replace(/\.csv$/i, "").replace(/[-_]+/g, " "));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read this CSV");
    }
  }

  async function summarize(event: React.FormEvent) {
    event.preventDefault();
    setGenerating(true);
    try {
      const next = await summarizeSurveyServerFn({ data: { surveyTitle, csvText } });
      setResult(next);
      toast.success("Survey summary ready for review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not summarize this survey");
    } finally {
      setGenerating(false);
    }
  }

  async function copySummary() {
    if (!result) return;
    const sections = [
      result.summary.executiveSummary,
      formatSection("Themes", result.summary.themes),
      formatSection("Strengths", result.summary.strengths),
      formatSection("Concerns", result.summary.concerns),
      formatSection("Recommended actions", result.summary.recommendedActions),
    ];
    await navigator.clipboard.writeText(sections.filter(Boolean).join("\n\n"));
    toast.success("Summary copied");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" />
            Summarize survey responses
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <form onSubmit={summarize} className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Upload a Qualtrics or other survey CSV. Common name, contact, location, and respondent
              identifier columns are removed before responses are sent to the configured AI
              provider.
            </p>
            <div className="space-y-2">
              <Label htmlFor="survey-summary-title">Survey title</Label>
              <Input
                id="survey-summary-title"
                value={surveyTitle}
                onChange={(event) => setSurveyTitle(event.target.value.slice(0, 160))}
                required
                minLength={3}
                maxLength={160}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="survey-summary-file">Response CSV</Label>
              <Input
                id="survey-summary-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void chooseFile(event.target.files?.[0])}
                required
              />
            </div>
            {preview && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{fileName}</p>
                <p className="mt-1 text-muted-foreground">
                  {preview.rowCount} responses · {preview.includedColumns.length} analysis columns
                  {preview.truncated ? " · sample truncated" : ""}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Removed columns:{" "}
                  {preview.excludedColumns.length
                    ? preview.excludedColumns.join(", ")
                    : "none detected"}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={generating || surveyTitle.trim().length < 3 || !preview}
              >
                {generating ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <Upload aria-hidden="true" />
                )}
                Summarize responses
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <ClipboardCheck aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Review-only AI summary</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {result.summary.executiveSummary}
                  </p>
                </div>
              </div>
            </div>
            <SummaryList title="Themes" items={result.summary.themes} />
            <SummaryList title="Strengths" items={result.summary.strengths} />
            <SummaryList title="Concerns" items={result.summary.concerns} />
            <SummaryList title="Recommended actions" items={result.summary.recommendedActions} />
            <p className="text-xs text-muted-foreground">
              Based on {result.privacy.responseCount} de-identified responses. Verify findings
              against the source CSV before using them in reports or decisions.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResult(null)}>
                Start over
              </Button>
              <Button type="button" onClick={() => void copySummary()}>
                <Copy aria-hidden="true" />
                Copy summary
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function formatSection(title: string, items: string[]) {
  return items.length ? `${title}\n${items.map((item) => `- ${item}`).join("\n")}` : "";
}
