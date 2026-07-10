import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  downloadAttendanceCsvTemplate,
  importAttendanceCsv,
  previewAttendanceCsvImport,
  type CsvImportPreview,
} from "@/lib/attendance";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { toast } from "sonner";
import { Download, Loader2, Upload } from "lucide-react";

type AttendanceImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  adminUserId?: string | null;
  onImported: () => void;
};

function PreviewSection({
  title,
  rows,
  variant,
}: {
  title: string;
  rows: CsvImportPreview["matched"];
  variant: "default" | "secondary" | "destructive" | "outline";
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <Badge variant={variant}>{rows.length}</Badge>
      </div>
      <ul className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2 text-xs text-muted-foreground">
        {rows.slice(0, 20).map((row) => (
          <li key={`${title}-${row.lineNumber}`}>
            Line {row.lineNumber}: {row.data.full_name || row.data.email || row.data.ticket_code || "—"}
            {row.reason ? ` — ${row.reason}` : ""}
          </li>
        ))}
        {rows.length > 20 && <li>…and {rows.length - 20} more</li>}
      </ul>
    </div>
  );
}

export function AttendanceImportDialog({
  open,
  onOpenChange,
  eventId,
  adminUserId,
  onImported,
}: AttendanceImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirmDialog();
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  function reset() {
    setCsvText("");
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const text = await file.text();
      setCsvText(text);
      const result = await previewAttendanceCsvImport(eventId, text);
      setPreview(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not parse CSV");
      reset();
    } finally {
      setLoading(false);
    }
  }

  async function runImport(options: {
    importValidRowsOnly?: boolean;
    createWalkInsForUnmatched?: boolean;
  }) {
    if (!csvText) return;
    setImporting(true);
    try {
      await importAttendanceCsv(eventId, csvText, {
        adminUserId,
        importValidRowsOnly: options.importValidRowsOnly,
        createWalkInsForUnmatched: options.createWalkInsForUnmatched,
      });
      toast.success("Attendance CSV imported");
      reset();
      onOpenChange(false);
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleImportMatched() {
    if (!preview) return;
    if (preview.invalid.length > 0 || preview.duplicate.length > 0) {
      const ok = await confirm({
        title: "Import valid rows only?",
        description:
          "This file has invalid or duplicate rows. Only matched rows with valid statuses will be imported.",
        confirmLabel: "Import valid rows",
      });
      if (!ok) return;
      await runImport({ importValidRowsOnly: true });
      return;
    }
    await runImport({});
  }

  async function handleImportWithWalkIns() {
    if (!preview || preview.unmatched.length === 0) return;
    const ok = await confirm({
      title: "Create walk-ins for unmatched rows?",
      description: `This will import ${preview.matched.length} matched row(s) and create walk-ins for ${preview.unmatched.length} unmatched row(s) that include a full name.`,
      confirmLabel: "Import and create walk-ins",
    });
    if (!ok) return;
    await runImport({
      importValidRowsOnly: preview.invalid.length > 0 || preview.duplicate.length > 0,
      createWalkInsForUnmatched: true,
    });
  }

  const hasIssues =
    !!preview && (preview.invalid.length > 0 || preview.duplicate.length > 0 || preview.unmatched.length > 0);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          onOpenChange(next);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import attendance CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadAttendanceCsvTemplate}>
                <Download className="mr-1 h-4 w-4" />
                Download template
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1 h-4 w-4" />
                )}
                Choose file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </div>

            {preview && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge>{preview.matched.length} matched</Badge>
                  <Badge variant="secondary">{preview.unmatched.length} unmatched</Badge>
                  <Badge variant="outline">{preview.duplicate.length} duplicate</Badge>
                  <Badge variant="destructive">{preview.invalid.length} invalid</Badge>
                </div>
                <PreviewSection title="Matched" rows={preview.matched} variant="default" />
                <PreviewSection title="Unmatched" rows={preview.unmatched} variant="secondary" />
                <PreviewSection title="Duplicate" rows={preview.duplicate} variant="outline" />
                <PreviewSection title="Invalid" rows={preview.invalid} variant="destructive" />
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {preview && preview.matched.length > 0 && (
              <Button type="button" onClick={() => void handleImportMatched()} disabled={importing}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import matched ({preview.matched.length})
              </Button>
            )}
            {preview && preview.unmatched.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleImportWithWalkIns()}
                disabled={importing}
              >
                Import + walk-ins
              </Button>
            )}
            {preview && preview.matched.length === 0 && hasIssues && (
              <p className="w-full text-sm text-muted-foreground">
                Fix invalid or duplicate rows, or confirm walk-in creation for unmatched entries.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialog}
    </>
  );
}
