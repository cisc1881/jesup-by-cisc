import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { LoadingState, PageContainer, QueryErrorState } from "@/components/design-system";
import { EligibilityBanner, InstitutionFields } from "@/components/institutions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { fetchPrograms } from "@/lib/programs";
import {
  isOtherInstitution,
  listInstitutions,
  resolveInstitutionFields,
  type InstitutionType,
} from "@/lib/institutions";
import {
  formatInquiryReference,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPES,
  INQUIRY_US_STATES,
  submitInquiry,
  type InquiryType,
  type PreferredContactMethod,
} from "@/lib/inquiries";
import { triggerEmailDelivery } from "@/lib/email-delivery";
import { MY_INQUIRIES_QUERY_KEY } from "@/lib/query-config";
import { listPageHead } from "@/lib/seo";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    inquiryType: INQUIRY_TYPES.includes(search.inquiryType as InquiryType)
      ? (search.inquiryType as InquiryType)
      : undefined,
    programId: typeof search.programId === "string" ? search.programId : undefined,
    message: typeof search.message === "string" ? search.message.slice(0, 1000) : undefined,
  }),
  head: () =>
    listPageHead({
      title: "Join / Connect",
      description:
        "Connect with CISC programs, partnerships, student opportunities, and Extension services across Alabama and beyond.",
      path: "/join",
    }),
  component: JoinPage,
});

type FormState = {
  inquiryType: InquiryType | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: PreferredContactMethod;
  programId: string;
  institutionId: string;
  institutionType: InstitutionType | "";
  organizationOrSchool: string;
  city: string;
  state: string;
  county: string;
  message: string;
  consentContact: boolean;
  newsletterOptIn: boolean;
  honeypot: string;
};

const initialForm: FormState = {
  inquiryType: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  preferredContact: "either",
  programId: "",
  institutionId: "",
  institutionType: "",
  organizationOrSchool: "",
  city: "",
  state: "",
  county: "",
  message: "",
  consentContact: false,
  newsletterOptIn: false,
  honeypot: "",
};

function JoinPage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    inquiryType: search.inquiryType ?? "",
    programId: search.programId ?? "",
    message: search.message ?? "",
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "submit", string>>>({});
  const [busy, setBusy] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const {
    data: institutions = [],
    isLoading: institutionsLoading,
    isError: institutionsError,
    refetch: refetchInstitutions,
  } = useQuery({
    queryKey: ["institutions", "join"],
    queryFn: () => listInstitutions({ activeOnly: true, includeOther: true }),
  });

  const {
    data: programs = [],
    isLoading: programsLoading,
    isError: programsError,
    refetch: refetchPrograms,
  } = useQuery({
    queryKey: ["programs", "join"],
    queryFn: () => fetchPrograms({ activeOnly: true }),
  });

  const formDataLoading = institutionsLoading || programsLoading;
  const formDataError = institutionsError || programsError;

  const selectedInstitution = useMemo(
    () => institutions.find((i) => i.id === form.institutionId) ?? null,
    [institutions, form.institutionId],
  );

  const showProgram =
    form.inquiryType === "join_program" || form.inquiryType === "student_opportunity";
  const showStudentEligibility = form.inquiryType === "student_opportunity";
  const showOtherSchool = !!selectedInstitution && isOtherInstitution(selectedInstitution);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.submit;
      return next;
    });
  }

  function handleInstitutionSelection(value: {
    institutionId: string;
    institutionType: InstitutionType | "";
    schoolName: string;
  }) {
    setForm((prev) => ({
      ...prev,
      institutionId: value.institutionId,
      institutionType: value.institutionType,
      organizationOrSchool: value.schoolName,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.organizationOrSchool;
      return next;
    });
  }

  function validate() {
    const next: Partial<Record<keyof FormState | "submit", string>> = {};
    if (!form.inquiryType) next.inquiryType = "Select an inquiry type.";
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    if (!form.consentContact) next.consentContact = "Consent to be contacted is required.";
    if (showOtherSchool && !form.organizationOrSchool.trim()) {
      next.organizationOrSchool = "Enter your school or organization name.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (form.honeypot.trim()) return;
    if (!validate()) return;

    setBusy(true);
    try {
      const resolved = resolveInstitutionFields(institutions, {
        institutionId: form.institutionId,
        institutionType: form.institutionType,
        schoolName: form.organizationOrSchool,
      });
      const id = await submitInquiry({
        inquiryType: form.inquiryType as InquiryType,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        preferredContact: form.preferredContact,
        programId: form.programId || null,
        institutionId: resolved.institutionId,
        institutionType: resolved.institutionType,
        organizationOrSchool: resolved.schoolName,
        city: form.city || null,
        state: form.state || null,
        county: form.county || null,
        message: form.message || null,
        consentContact: true,
        newsletterOptIn: form.newsletterOptIn,
        userId: user?.id ?? null,
      });
      triggerEmailDelivery();
      setReferenceId(id);
      setForm(initialForm);
      if (user?.id) {
        await qc.invalidateQueries({ queryKey: [...MY_INQUIRIES_QUERY_KEY, user.id] });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to submit your inquiry. Please try again.";
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (referenceId) {
    return (
      <PublicLayout>
        <PageHeader
          eyebrow="Thank you"
          title="We received your inquiry"
          description="A member of the CISC team will follow up using your preferred contact method."
        />
        <PageContainer size="md" className="pb-bottom-nav md:pb-[var(--page-py)]">
          <Card className="border-primary/20 bg-primary/5" aria-live="polite">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your reference number</p>
                <p
                  className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary"
                  aria-label={`Reference number ${formatInquiryReference(referenceId)}`}
                >
                  {formatInquiryReference(referenceId)}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Save this reference if you need to follow up with our team.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setReferenceId(null)}>
                Submit another inquiry
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Connect with CISC"
        title={form.inquiryType === "join_program" ? "Join a CISC Program" : "Join / Connect"}
        description={
          form.inquiryType === "join_program"
            ? "Submit your program interest directly through JESUP. Your request will be tracked here from submission through staff follow-up."
            : "Tell us how you'd like to connect with Cooperative Extension programs, partnerships, student opportunities, and community services. All schools and institutions are welcome."
        }
      />
      <PageContainer size="md" className="pb-bottom-nav md:pb-[var(--page-py)]">
        {formDataLoading && <LoadingState label="Loading form options…" className="mb-4" />}
        {formDataError && (
          <QueryErrorState
            title="Couldn't load form options"
            description="Institution and program lists are required to submit an inquiry."
            onRetry={() => {
              void refetchInstitutions();
              void refetchPrograms();
            }}
            className="mb-4"
          />
        )}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
              aria-busy={busy || formDataLoading}
            >
              <div
                className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                aria-hidden="true"
              >
                <Label htmlFor="company_website">Company website</Label>
                <Input
                  id="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) => setField("honeypot", e.target.value)}
                />
              </div>

              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-foreground">How can we help?</legend>
                <div className="space-y-2">
                  <Label htmlFor="inquiryType">Inquiry type *</Label>
                  <Select
                    value={form.inquiryType}
                    onValueChange={(v) => setField("inquiryType", v as InquiryType)}
                  >
                    <SelectTrigger
                      id="inquiryType"
                      aria-invalid={!!errors.inquiryType}
                      aria-describedby={errors.inquiryType ? "inquiryType-error" : undefined}
                    >
                      <SelectValue placeholder="Choose an inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INQUIRY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {INQUIRY_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.inquiryType && (
                    <p id="inquiryType-error" className="text-sm text-destructive" role="alert">
                      {errors.inquiryType}
                    </p>
                  )}
                </div>

                {showStudentEligibility && <EligibilityBanner />}

                {showProgram && (
                  <div className="space-y-2">
                    <Label htmlFor="programId">Program of interest</Label>
                    <Select
                      value={form.programId || "none"}
                      onValueChange={(v) => setField("programId", v === "none" ? "" : v)}
                    >
                      <SelectTrigger id="programId">
                        <SelectValue placeholder="Select a program (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific program</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-foreground">Your information</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={form.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? "firstName-error" : undefined}
                    />
                    {errors.firstName && (
                      <p id="firstName-error" className="text-sm text-destructive" role="alert">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={form.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? "lastName-error" : undefined}
                    />
                    {errors.lastName && (
                      <p id="lastName-error" className="text-sm text-destructive" role="alert">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-destructive" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredContact">Preferred contact method</Label>
                  <Select
                    value={form.preferredContact}
                    onValueChange={(v) => setField("preferredContact", v as PreferredContactMethod)}
                  >
                    <SelectTrigger id="preferredContact">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="either">Email or phone</SelectItem>
                      <SelectItem value="email">Email only</SelectItem>
                      <SelectItem value="phone">Phone only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-foreground">
                  School or institution
                </legend>
                <InstitutionFields
                  institutions={institutions}
                  value={{
                    institutionId: form.institutionId,
                    institutionType: form.institutionType,
                    schoolName: form.organizationOrSchool,
                  }}
                  onChange={handleInstitutionSelection}
                  errors={{
                    schoolName: errors.organizationOrSchool,
                  }}
                  requiredSchoolName={showOtherSchool}
                  idPrefix="join"
                  disabled={busy || formDataLoading}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={form.state || "none"}
                      onValueChange={(v) => setField("state", v === "none" ? "" : v)}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {INQUIRY_US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      value={form.county}
                      onChange={(e) => setField("county", e.target.value)}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  placeholder="Tell us more about your interest, goals, or questions."
                />
              </div>

              <fieldset className="space-y-3 rounded-lg border border-border/60 p-4">
                <legend className="px-1 text-sm font-semibold text-foreground">Consent</legend>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consentContact"
                    checked={form.consentContact}
                    onCheckedChange={(checked) => setField("consentContact", checked === true)}
                    aria-invalid={!!errors.consentContact}
                    aria-describedby={errors.consentContact ? "consentContact-error" : undefined}
                  />
                  <Label htmlFor="consentContact" className="text-sm leading-relaxed">
                    I consent to be contacted by CISC / Tuskegee Extension about this inquiry. *
                  </Label>
                </div>
                {errors.consentContact && (
                  <p id="consentContact-error" className="text-sm text-destructive" role="alert">
                    {errors.consentContact}
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="newsletterOptIn"
                    checked={form.newsletterOptIn}
                    onCheckedChange={(checked) => setField("newsletterOptIn", checked === true)}
                  />
                  <Label htmlFor="newsletterOptIn" className="text-sm leading-relaxed">
                    Send me occasional updates about programs and events (optional).
                  </Label>
                </div>
              </fieldset>

              {errors.submit && (
                <p
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {errors.submit}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={busy || formDataLoading || formDataError}
              >
                {busy ? "Submitting…" : "Submit inquiry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </PublicLayout>
  );
}
