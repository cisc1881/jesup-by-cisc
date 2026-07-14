import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AppButton } from "@/components/design-system";
import {
  createAnonymousEvaluationResponse,
  createIdentifiedEvaluationResponse,
  EVALUATION_RESPONSE_MODE_LABELS,
  markMyAttendanceEvaluationComplete,
  readAnonymousEvaluationToken,
  submitAnonymousEvaluationAnswers,
  submitIdentifiedEvaluationAnswers,
  validateEvaluationAnswers,
  type EvaluationAnswerInput,
  type EvaluationQuestion,
  type EventEvaluation,
} from "@/lib/evaluations";
import {
  demographicFormFromEvaluationAnswers,
  filterNonDemographicEvaluationQuestions,
  hasAnyDemographicField,
  submitAnonymousEvaluationDemographics,
  submitMyParticipantDemographics,
  type DemographicFormData,
} from "@/lib/demographics";
import { PrivacyNotice } from "@/components/demographics/privacy-notice";
import { eventDemographicAggregatesQueryKey } from "@/lib/query-config";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type NativeEvaluationFormProps = {
  evaluation: EventEvaluation;
  eventId: string;
  eventTitle: string;
  questions: EvaluationQuestion[];
  isAuthenticated: boolean;
  attendanceId?: string | null;
  onCompleted: () => void;
};

export function NativeEvaluationForm({
  evaluation,
  eventId,
  eventTitle,
  questions,
  isAuthenticated,
  attendanceId,
  onCompleted,
}: NativeEvaluationFormProps) {
  const qc = useQueryClient();
  const standardQuestions = useMemo(
    () => filterNonDemographicEvaluationQuestions(questions),
    [questions],
  );
  const demographicQuestions = useMemo(
    () => questions.filter((q) => q.isDemographic || q.questionType === "demographic"),
    [questions],
  );
  const [answers, setAnswers] = useState<Record<string, EvaluationAnswerInput>>({});
  const [demographicConsent, setDemographicConsent] = useState(false);
  const [errors, setErrors] = useState<{ questionId: string; prompt: string; message: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const answerMap = useMemo(() => new Map(Object.entries(answers).map(([k, v]) => [k, v])), [answers]);
  const progress = questions.length
    ? Math.round(
        (questions.filter((q) => {
          const a = answers[q.id];
          return a && (a.valueText != null || a.valueNumber != null || a.valueJson != null);
        }).length /
          questions.length) *
          100,
      )
    : 0;

  function buildDemographicPayload(): DemographicFormData {
    const mapped = demographicFormFromEvaluationAnswers(demographicQuestions, answerMap);
    mapped.consent = demographicConsent;
    return mapped;
  }

  function setAnswer(questionId: string, patch: Partial<EvaluationAnswerInput>) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, ...prev[questionId], ...patch },
    }));
  }

  async function ensureResponse() {
    if (responseId) return { responseId, accessToken };

    if (evaluation.responseMode === "anonymous") {
      const created = await createAnonymousEvaluationResponse(evaluation.id);
      setResponseId(created.responseId);
      setAccessToken(created.accessToken);
      return created;
    }

    const created = await createIdentifiedEvaluationResponse(evaluation.id, eventId);
    setResponseId(created.responseId);
    return { responseId: created.responseId, accessToken: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const validationErrors = validateEvaluationAnswers(standardQuestions, answerMap);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setStatusMessage("Please fix the highlighted questions.");
      return;
    }

    const demographicPayload = buildDemographicPayload();
    if (demographicQuestions.length > 0 && hasAnyDemographicField(demographicPayload) && !demographicConsent) {
      setStatusMessage("Consent is required when answering demographic questions.");
      return;
    }
    setErrors([]);

    setSubmitting(true);
    try {
      const session = await ensureResponse();
      const payload = standardQuestions.map((q) => answers[q.id] ?? { questionId: q.id });

      if (evaluation.responseMode === "anonymous") {
        const token = session.accessToken ?? readAnonymousEvaluationToken(session.responseId);
        if (!token) throw new Error("Anonymous session expired. Refresh and try again.");
        await submitAnonymousEvaluationAnswers(session.responseId, token, payload);

        if (demographicQuestions.length > 0 && hasAnyDemographicField(demographicPayload)) {
          await submitAnonymousEvaluationDemographics(session.responseId, token, demographicPayload);
        }

        if (isAuthenticated && attendanceId) {
          await markMyAttendanceEvaluationComplete(attendanceId);
        }
      } else {
        await submitIdentifiedEvaluationAnswers(
          session.responseId,
          evaluation.id,
          payload,
          attendanceId,
        );

        if (demographicQuestions.length > 0 && hasAnyDemographicField(demographicPayload)) {
          await submitMyParticipantDemographics("evaluation", session.responseId, demographicPayload);
        }
      }

      void qc.invalidateQueries({ queryKey: eventDemographicAggregatesQueryKey(eventId) });

      setStatusMessage("Thank you — your evaluation has been submitted.");
      onCompleted();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-token-soft sm:p-6">
        <h1 className="text-2xl font-black text-foreground">{evaluation.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{eventTitle}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {evaluation.responseMode === "anonymous"
            ? "Your responses are anonymous. We do not link your answers to your account."
            : `This evaluation is ${EVALUATION_RESPONSE_MODE_LABELS.identified.toLowerCase()} and tied to your registration.`}
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div aria-live="polite" className="min-h-5 text-sm text-destructive">
        {statusMessage}
      </div>

      <div className="space-y-5">
        {questions.map((question, index) => {
          const fieldError = errors.find((err) => err.questionId === question.id);
          const isDemographic = question.isDemographic || question.questionType === "demographic";
          return (
            <div
              key={question.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-token-soft sm:p-5"
            >
              <Label className="text-base font-semibold">
                {index + 1}. {question.prompt}
                {question.isRequired && <span className="text-destructive"> *</span>}
              </Label>
              {isDemographic && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Demographic responses are stored for aggregate reporting only.
                </p>
              )}
              {question.helpText && (
                <p className="mt-1 text-sm text-muted-foreground">{question.helpText}</p>
              )}
              <div className="mt-3">
                <QuestionField
                  question={question}
                  value={answers[question.id]}
                  onChange={(patch) => setAnswer(question.id, patch)}
                />
              </div>
              {fieldError && <p className="mt-2 text-sm text-destructive">{fieldError.message}</p>}
            </div>
          );
        })}
      </div>

      {demographicQuestions.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
          <PrivacyNotice />
          <div className="flex items-start gap-3">
            <Checkbox
              id="eval-demo-consent"
              checked={demographicConsent}
              onCheckedChange={(checked) => setDemographicConsent(checked === true)}
            />
            <Label htmlFor="eval-demo-consent" className="leading-relaxed">
              I consent to JESUP storing my optional demographic evaluation responses for aggregate reporting only.
            </Label>
          </div>
        </div>
      )}

      <div className="sticky bottom-4 z-10 rounded-2xl border bg-background/95 p-4 shadow-token-soft backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <AppButton type="submit" variant="primary" size="lg" shape="pill" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit evaluation
        </AppButton>
      </div>
    </form>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: EvaluationQuestion;
  value?: EvaluationAnswerInput;
  onChange: (patch: Partial<EvaluationAnswerInput>) => void;
}) {
  const choices = (question.options?.choices as string[] | undefined) ?? [];
  const min = Number(question.options?.min ?? 1);
  const max = Number(question.options?.max ?? 5);

  if (question.questionType === "rating" || question.questionType === "number") {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <Button
            key={n}
            type="button"
            size="lg"
            variant={value?.valueNumber === n ? "default" : "outline"}
            className="min-w-12"
            onClick={() => onChange({ valueNumber: n, valueText: null, valueJson: null })}
          >
            {n}
          </Button>
        ))}
      </div>
    );
  }

  if (question.questionType === "yes_no") {
    return (
      <RadioGroup
        value={value?.valueText ?? ""}
        onValueChange={(v) => onChange({ valueText: v, valueNumber: null, valueJson: null })}
        className="flex gap-4"
      >
        {["yes", "no"].map((option) => (
          <div key={option} className="flex items-center gap-2">
            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
            <Label htmlFor={`${question.id}-${option}`} className="capitalize">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (question.questionType === "single_choice") {
    return (
      <RadioGroup
        value={value?.valueText ?? ""}
        onValueChange={(v) => onChange({ valueText: v, valueNumber: null, valueJson: null })}
        className="space-y-2"
      >
        {choices.map((choice) => (
          <div key={choice} className="flex items-center gap-2">
            <RadioGroupItem value={choice} id={`${question.id}-${choice}`} />
            <Label htmlFor={`${question.id}-${choice}`}>{choice}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (question.questionType === "multi_choice") {
    const selected = Array.isArray(value?.valueJson) ? (value!.valueJson as string[]) : [];
    return (
      <div className="space-y-2">
        {choices.map((choice) => (
          <div key={choice} className="flex items-center gap-2">
            <Checkbox
              id={`${question.id}-${choice}`}
              checked={selected.includes(choice)}
              onCheckedChange={(checked) => {
                const next = checked
                  ? [...selected, choice]
                  : selected.filter((item) => item !== choice);
                onChange({ valueJson: next, valueText: null, valueNumber: null });
              }}
            />
            <Label htmlFor={`${question.id}-${choice}`}>{choice}</Label>
          </div>
        ))}
      </div>
    );
  }

  if (question.questionType === "consent") {
    const accepted = value?.valueJson === true;
    return (
      <div className="flex items-start gap-3">
        <Checkbox
          id={`${question.id}-consent`}
          checked={accepted}
          onCheckedChange={(checked) =>
            onChange({
              valueJson: checked === true,
              valueText: checked === true ? "yes" : "no",
              valueNumber: null,
            })
          }
        />
        <Label htmlFor={`${question.id}-consent`} className="leading-relaxed">
          {question.helpText ?? question.prompt}
        </Label>
      </div>
    );
  }

  if (question.questionType === "demographic") {
    const options = (question.options?.choices as string[] | undefined) ?? [];
    if (options.length > 0) {
      return (
        <RadioGroup
          value={value?.valueText ?? ""}
          onValueChange={(v) => onChange({ valueText: v, valueNumber: null, valueJson: null })}
          className="space-y-2"
        >
          {options.map((choice) => (
            <div key={choice} className="flex items-center gap-2">
              <RadioGroupItem value={choice} id={`${question.id}-${choice}`} />
              <Label htmlFor={`${question.id}-${choice}`}>{choice}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }
  }

  if (question.questionType === "long_text") {
    return (
      <Textarea
        value={value?.valueText ?? ""}
        onChange={(e) => onChange({ valueText: e.target.value, valueNumber: null, valueJson: null })}
        rows={4}
      />
    );
  }

  return (
    <Input
      value={value?.valueText ?? ""}
      onChange={(e) => onChange({ valueText: e.target.value, valueNumber: null, valueJson: null })}
    />
  );
}
