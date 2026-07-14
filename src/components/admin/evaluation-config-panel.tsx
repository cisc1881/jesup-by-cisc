import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  createEvaluationQuestion,
  createOrUpdateEventEvaluation,
  deleteEvaluationQuestion,
  EVALUATION_QUESTION_TYPE_LABELS,
  EVALUATION_RESPONSE_MODE_LABELS,
  getEvaluationPublicUrl,
  getEventEvaluation,
  insertDefaultEvaluationTemplate,
  listEvaluationQuestions,
  reorderEvaluationQuestions,
  updateEvaluationQuestion,
  type EvaluationQuestion,
  type EvaluationQuestionType,
  type EventEvaluation,
} from "@/lib/evaluations";
import {
  evaluationQuestionsQueryKey,
  eventEvaluationQueryKey,
} from "@/lib/query-config";
import { toast } from "sonner";
import { Copy, ExternalLink, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";

type EvaluationConfigPanelProps = {
  eventId: string | null;
};

const QUESTION_TYPES = Object.keys(EVALUATION_QUESTION_TYPE_LABELS) as EvaluationQuestionType[];

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export function EvaluationConfigPanel({ eventId }: EvaluationConfigPanelProps) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [insertingTemplate, setInsertingTemplate] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<EvaluationQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    questionType: "rating" as EvaluationQuestionType,
    prompt: "",
    helpText: "",
    isRequired: false,
    choices: "",
    isDemographic: false,
  });

  const { data: evaluation, isLoading } = useQuery({
    queryKey: eventEvaluationQueryKey(eventId ?? "new"),
    enabled: !!eventId,
    queryFn: () => getEventEvaluation(eventId!),
  });

  const { data: questions = [], refetch: refetchQuestions } = useQuery({
    queryKey: evaluationQuestionsQueryKey(evaluation?.id ?? "none"),
    enabled: !!evaluation?.id,
    queryFn: () => listEvaluationQuestions(evaluation!.id),
  });

  const [form, setForm] = useState({
    title: "Post-event evaluation",
    qualtricsUrl: "",
    useNativeForm: true,
    isRequired: false,
    responseMode: "anonymous" as EventEvaluation["responseMode"],
    opensAt: "",
    closesAt: "",
    isActive: false,
  });

  useEffect(() => {
    if (evaluation) {
      setForm({
        title: evaluation.title,
        qualtricsUrl: evaluation.qualtricsUrl ?? "",
        useNativeForm: evaluation.useNativeForm,
        isRequired: evaluation.isRequired,
        responseMode: evaluation.responseMode,
        opensAt: toDatetimeLocal(evaluation.opensAt),
        closesAt: toDatetimeLocal(evaluation.closesAt),
        isActive: evaluation.isActive,
      });
    }
  }, [evaluation]);

  if (!eventId) {
    return <p className="text-sm text-muted-foreground">Save the event first to configure evaluations.</p>;
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading evaluation settings…</p>;

  async function saveConfig() {
    setSaving(true);
    try {
      const saved = await createOrUpdateEventEvaluation({
        eventId,
        title: form.title,
        qualtricsUrl: form.qualtricsUrl,
        useNativeForm: form.useNativeForm,
        isRequired: form.isRequired,
        responseMode: form.responseMode,
        opensAt: form.opensAt ? new Date(form.opensAt).toISOString() : null,
        closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
        isActive: form.isActive,
      });
      toast.success("Evaluation settings saved");
      await qc.invalidateQueries({ queryKey: eventEvaluationQueryKey(eventId) });
      await qc.invalidateQueries({ queryKey: evaluationQuestionsQueryKey(saved.id) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save evaluation");
    } finally {
      setSaving(false);
    }
  }

  async function handleInsertDefaults() {
    if (!evaluation?.id) {
      toast.error("Save evaluation settings first.");
      return;
    }
    setInsertingTemplate(true);
    try {
      const created = await insertDefaultEvaluationTemplate(evaluation.id);
      toast.success(created > 0 ? `Added ${created} default questions` : "Default template already exists");
      await refetchQuestions();
      await qc.invalidateQueries({ queryKey: evaluationQuestionsQueryKey(evaluation.id) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not insert template");
    } finally {
      setInsertingTemplate(false);
    }
  }

  async function handleAddQuestion() {
    if (!evaluation?.id || !newQuestion.prompt.trim()) return;
    try {
      const options =
        newQuestion.questionType === "single_choice" || newQuestion.questionType === "multi_choice"
          ? { choices: newQuestion.choices.split(",").map((c) => c.trim()).filter(Boolean) }
          : newQuestion.questionType === "rating"
            ? { min: 1, max: 5 }
            : null;

      await createEvaluationQuestion({
        evaluationId: evaluation.id,
        questionType: newQuestion.questionType,
        prompt: newQuestion.prompt,
        helpText: newQuestion.helpText,
        isRequired: newQuestion.isRequired,
        isDemographic: newQuestion.isDemographic,
        options,
      });
      setNewQuestion({
        questionType: "rating",
        prompt: "",
        helpText: "",
        isRequired: false,
        choices: "",
        isDemographic: false,
      });
      await refetchQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add question");
    }
  }

  async function moveQuestion(questionId: string, direction: -1 | 1) {
    if (!evaluation?.id) return;
    const index = questions.findIndex((q) => q.id === questionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= questions.length) return;
    const ordered = [...questions];
    const [item] = ordered.splice(index, 1);
    ordered.splice(target, 0, item);
    await reorderEvaluationQuestions(
      evaluation.id,
      ordered.map((q) => q.id),
    );
    await refetchQuestions();
  }

  const publicUrl = getEvaluationPublicUrl(eventId);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Evaluation title</Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          <Label>Evaluation enabled</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.useNativeForm} onCheckedChange={(v) => setForm((f) => ({ ...f, useNativeForm: v }))} />
          <Label>Use native form</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.isRequired} onCheckedChange={(v) => setForm((f) => ({ ...f, isRequired: v }))} />
          <Label>Required</Label>
        </div>
        <div className="space-y-2">
          <Label>Response mode</Label>
          <Select
            value={form.responseMode}
            onValueChange={(v) => setForm((f) => ({ ...f, responseMode: v as EventEvaluation["responseMode"] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["anonymous", "identified"] as const).map((mode) => (
                <SelectItem key={mode} value={mode}>{EVALUATION_RESPONSE_MODE_LABELS[mode]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Qualtrics URL (when native form is off)</Label>
          <Input value={form.qualtricsUrl} onChange={(e) => setForm((f) => ({ ...f, qualtricsUrl: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Opens at</Label>
          <Input type="datetime-local" value={form.opensAt} onChange={(e) => setForm((f) => ({ ...f, opensAt: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Closes at</Label>
          <Input type="datetime-local" value={form.closesAt} onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Reminder status</Label>
          <Input
            disabled
            value={evaluation?.reminderSentAt ? `Sent ${new Date(evaluation.reminderSentAt).toLocaleString()}` : "Not sent"}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void saveConfig()} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save evaluation settings
        </Button>
        <Button variant="outline" onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success("Link copied"))}>
          <Copy className="mr-1 h-4 w-4" /> Copy public link
        </Button>
        <Button variant="outline" asChild>
          <a href={publicUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1 h-4 w-4" /> Preview
          </a>
        </Button>
      </div>

      {form.useNativeForm && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">Question builder</h3>
            <Button variant="outline" size="sm" onClick={() => void handleInsertDefaults()} disabled={insertingTemplate}>
              {insertingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Insert default template
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => void moveQuestion(question.id, -1)} disabled={index === 0}>
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{question.prompt}</span>
                      <Badge variant="outline">{EVALUATION_QUESTION_TYPE_LABELS[question.questionType]}</Badge>
                      {question.isRequired && <Badge>Required</Badge>}
                      {question.isDefault && <Badge variant="secondary">Default</Badge>}
                      {question.isDemographic && <Badge variant="secondary">Demographic</Badge>}
                    </div>
                    {question.helpText && <p className="mt-1 text-xs text-muted-foreground">{question.helpText}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingQuestion(question)}>Edit</Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        await deleteEvaluationQuestion(question.id);
                        await refetchQuestions();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-3 rounded-md border border-dashed p-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>New question prompt</Label>
              <Input value={newQuestion.prompt} onChange={(e) => setNewQuestion((q) => ({ ...q, prompt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newQuestion.questionType} onValueChange={(v) => setNewQuestion((q) => ({ ...q, questionType: v as EvaluationQuestionType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{EVALUATION_QUESTION_TYPE_LABELS[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Choices (comma-separated)</Label>
              <Input
                value={newQuestion.choices}
                onChange={(e) => setNewQuestion((q) => ({ ...q, choices: e.target.value }))}
                disabled={newQuestion.questionType !== "single_choice" && newQuestion.questionType !== "multi_choice"}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Help text</Label>
              <Textarea value={newQuestion.helpText} onChange={(e) => setNewQuestion((q) => ({ ...q, helpText: e.target.value }))} rows={2} />
            </div>
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Switch checked={newQuestion.isRequired} onCheckedChange={(v) => setNewQuestion((q) => ({ ...q, isRequired: v }))} />
                <Label>Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newQuestion.isDemographic} onCheckedChange={(v) => setNewQuestion((q) => ({ ...q, isDemographic: v }))} />
                <Label>Demographic</Label>
              </div>
            </div>
            <Button type="button" onClick={() => void handleAddQuestion()} className="sm:col-span-2">
              <Plus className="mr-1 h-4 w-4" /> Add question
            </Button>
          </div>
        </div>
      )}

      {editingQuestion && (
        <QuestionEditDialog
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={async () => {
            setEditingQuestion(null);
            await refetchQuestions();
          }}
        />
      )}
    </div>
  );
}

function QuestionEditDialog({
  question,
  onClose,
  onSaved,
}: {
  question: EvaluationQuestion;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [helpText, setHelpText] = useState(question.helpText ?? "");
  const [isRequired, setIsRequired] = useState(question.isRequired);
  const [isDemographic, setIsDemographic] = useState(question.isDemographic);
  const [choices, setChoices] = useState(
    Array.isArray(question.options?.choices) ? (question.options!.choices as string[]).join(", ") : "",
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const options =
        question.questionType === "single_choice" || question.questionType === "multi_choice"
          ? { choices: choices.split(",").map((c) => c.trim()).filter(Boolean) }
          : question.options;
      await updateEvaluationQuestion(question.id, {
        prompt,
        helpText,
        isRequired,
        isDemographic,
        options,
      });
      toast.success("Question updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update question");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <CardContent className="space-y-4 p-6">
          <h3 className="font-medium">Edit question</h3>
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Help text</Label>
            <Textarea value={helpText} onChange={(e) => setHelpText(e.target.value)} rows={2} />
          </div>
          {(question.questionType === "single_choice" || question.questionType === "multi_choice") && (
            <div className="space-y-2">
              <Label>Choices</Label>
              <Input value={choices} onChange={(e) => setChoices(e.target.value)} />
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              <Label>Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isDemographic} onCheckedChange={setIsDemographic} />
              <Label>Demographic</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
