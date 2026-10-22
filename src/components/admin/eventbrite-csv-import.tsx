import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importEventbriteCsv } from "@/lib/eventbrite-import.functions";
import { EVENTBRITE_IMPORT_MAX_BYTES, EVENTBRITE_TEMPLATE_HEADER } from "@/lib/eventbrite-import";

type Result = Awaited<ReturnType<typeof importEventbriteCsv>>;
const LABELS: [keyof Result["counts"], string][] = [
  ["new", "New"], ["update", "Update"], ["duplicate", "Unchanged"], ["cancelled", "Cancelled"], ["conflict", "Conflict"], ["invalid", "Invalid"],
];

export function EventbriteCsvImport({ eventId, onImported }: { eventId: string; onImported: () => void }) {
  const run = useServerFn(importEventbriteCsv);
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [preview, setPreview] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file?: File) {
    setPreview(null);
    if (!file) return;
    if (file.size > EVENTBRITE_IMPORT_MAX_BYTES) { toast.error("File is larger than 2 MB."); return; }
    setCsv(await file.text()); setFileName(file.name); setRequestId(crypto.randomUUID());
  }
  async function submit(commit: boolean) {
    if (!csv) return;
    setBusy(true);
    try {
      const result = await run({ data: { eventId, requestId, csv, commit } });
      setPreview(result);
      if (commit) {
        toast.success(result.replayed ? "This import was already saved." : "Eventbrite attendees imported.");
        onImported();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally { setBusy(false); }
  }
  function downloadTemplate() {
    const blob = new Blob([EVENTBRITE_TEMPLATE_HEADER + "\n"], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "eventbrite-attendees-template.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
        <p className="font-semibold">Import existing Eventbrite registrants</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>In Eventbrite, open this event → Reports → Attendee summary, and export as CSV.</li>
          <li>Upload it here and choose <strong>Preview</strong>. Nothing is saved during preview.</li>
          <li>Review the counts and line issues, then choose <strong>Import</strong>.</li>
        </ol>
        <p className="text-muted-foreground">Required columns: Attendee #, Barcode #, Email, and First Name/Last Name (or Name). Attendee Status is used to mark cancellations. Ticket type, price and order columns are ignored: no tickets, meals or add-ons are issued and registration stays as configured. Attendees link their account by signing in with the same verified email and entering their original Eventbrite barcode. This is separate from the attendance CSV import.</p>
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>Download template</Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="eventbrite-csv">Eventbrite attendee CSV (max 2 MB, 5,000 rows)</Label>
        <Input id="eventbrite-csv" type="file" accept=".csv,text/csv" onChange={(e) => void onFile(e.target.files?.[0])} />
        {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={!csv || busy} onClick={() => void submit(false)}>{busy ? "Working…" : "Preview"}</Button>
        <Button type="button" disabled={!csv || busy || !preview || preview.committed} onClick={() => void submit(true)}>Import</Button>
      </div>
      {preview && (
        <div className="space-y-3" role="status">
          <p className="text-sm font-medium">{preview.committed ? (preview.replayed ? "Already imported (no changes made)" : "Import saved") : "Preview — nothing saved yet"} · {preview.totalRows} rows, {preview.valid} valid</p>
          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LABELS.map(([key, label]) => (
              <div key={key} className="rounded-md border p-2 text-center"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-lg font-semibold">{preview.counts[key] ?? 0}</dd></div>
            ))}
          </dl>
          {preview.issues.length > 0 && (
            <ul className="max-h-64 space-y-1 overflow-auto rounded-md border p-3 text-sm">
              {preview.issues.map((issue, i) => <li key={i}><span className="font-mono">Line {issue.line}</span> · <span className="capitalize">{issue.outcome}</span>: {issue.reason}</li>)}
            </ul>
          )}
          {preview.ignoredColumns.length > 0 && <p className="text-xs text-muted-foreground">Ignored columns: {preview.ignoredColumns.join(", ")}</p>}
        </div>
      )}
    </div>
  );
}
