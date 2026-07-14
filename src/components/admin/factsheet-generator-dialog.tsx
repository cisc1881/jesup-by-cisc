import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateFactsheetServerFn } from "@/modules/ai/factsheet-server-fn";
import type { FactsheetDraft } from "@/modules/ai/server/factsheet";

type FactsheetGeneratorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftReady: (draft: FactsheetDraft) => void;
};

export function FactsheetGeneratorDialog({
  open,
  onOpenChange,
  onDraftReady,
}: FactsheetGeneratorDialogProps) {
  const [topic, setTopic] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setGenerating(true);
    try {
      const draft = await generateFactsheetServerFn({ data: { topic, researchNotes } });
      onDraftReady(draft);
      onOpenChange(false);
      toast.success("Draft ready for review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate a factsheet draft");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" />
            Generate factsheet draft
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">
          JESUP will create publication metadata from your notes. The result opens as an inactive
          draft and must be reviewed before saving or publishing.
        </p>
        <form onSubmit={generate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="factsheet-topic">Topic</Label>
            <Input
              id="factsheet-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value.slice(0, 160))}
              placeholder="For example: Soil health for small farms"
              required
              minLength={3}
              maxLength={160}
              disabled={generating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="factsheet-notes">Research notes</Label>
            <Textarea
              id="factsheet-notes"
              value={researchNotes}
              onChange={(event) => setResearchNotes(event.target.value.slice(0, 12_000))}
              placeholder="Paste reviewed research notes, source findings, author information, and approved recommendations…"
              rows={12}
              required
              minLength={40}
              maxLength={12_000}
              disabled={generating}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Only include information approved for drafting.</span>
              <span>{researchNotes.length}/12,000</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={generating || topic.trim().length < 3 || researchNotes.trim().length < 40}
            >
              {generating ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" />
              )}
              Generate draft
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
