import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstitutionCombobox } from "@/components/institutions/institution-combobox";
import { listInstitutions } from "@/lib/institutions";
import { INQUIRY_US_STATES } from "@/lib/inquiries";
import type { AcademicLevel } from "@/lib/institutions";
import {
  buildEmptyDemographicForm,
  getDemographicOptionGroups,
  validateDemographicForm,
  type DemographicFormData,
  type TriStateBoolean,
} from "@/lib/demographics";
import { PrivacyNotice } from "./privacy-notice";

type DemographicFormProps = {
  value?: DemographicFormData;
  onChange?: (form: DemographicFormData) => void;
  showInstitution?: boolean;
  idPrefix?: string;
};

const NONE = "__none__";

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TriStateField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: TriStateBoolean;
  options: { value: string; label: string }[];
  onChange: (value: TriStateBoolean) => void;
}) {
  const selected =
    value === true ? "yes" : value === false ? "no" : value === "prefer_not_to_answer" ? "prefer_not_to_answer" : NONE;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={selected}
        onValueChange={(v) => {
          if (v === NONE) onChange(null);
          else if (v === "yes") onChange(true);
          else if (v === "no") onChange(false);
          else onChange("prefer_not_to_answer");
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DemographicForm({
  value,
  onChange,
  showInstitution = true,
  idPrefix = "demo",
}: DemographicFormProps) {
  const [internal, setInternal] = useState<DemographicFormData>(value ?? buildEmptyDemographicForm());
  const form = value ?? internal;
  const options = useMemo(() => getDemographicOptionGroups(), []);
  const errors = validateDemographicForm(form);
  const { data: institutions = [] } = useQuery({
    queryKey: ["institutions", "demographic-form"],
    queryFn: () => listInstitutions(),
  });

  function update(patch: Partial<DemographicFormData>) {
    const next = { ...form, ...patch };
    if (onChange) onChange(next);
    else setInternal(next);
  }

  return (
    <div className="space-y-5">
      <PrivacyNotice />

      <p className="text-sm text-muted-foreground">
        All questions below are optional. You may skip this section entirely.
      </p>

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          <ul className="list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error.field}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id={`${idPrefix}-age`}
          label="Age range"
          value={form.ageRange}
          options={options.ageRange}
          onChange={(ageRange) => update({ ageRange })}
        />
        <SelectField
          id={`${idPrefix}-race`}
          label="Race"
          value={form.race}
          options={options.race}
          onChange={(race) => update({ race })}
        />
        <SelectField
          id={`${idPrefix}-ethnicity`}
          label="Ethnicity"
          value={form.ethnicity}
          options={options.ethnicity}
          onChange={(ethnicity) => update({ ethnicity })}
        />
        <SelectField
          id={`${idPrefix}-gender`}
          label="Gender"
          value={form.gender}
          options={options.gender}
          onChange={(gender) => update({ gender })}
        />
        <SelectField
          id={`${idPrefix}-veteran`}
          label="Veteran status"
          value={form.veteranStatus}
          options={options.veteranStatus}
          onChange={(veteranStatus) => update({ veteranStatus })}
        />
        <SelectField
          id={`${idPrefix}-disability`}
          label="Disability status"
          value={form.disabilityStatus}
          options={options.disabilityStatus}
          onChange={(disabilityStatus) => update({ disabilityStatus })}
        />
        <SelectField
          id={`${idPrefix}-farmer`}
          label="Farmer or producer status"
          value={form.farmerProducerStatus}
          options={options.farmerProducerStatus}
          onChange={(farmerProducerStatus) => update({ farmerProducerStatus })}
        />
        <TriStateField
          id={`${idPrefix}-beginning`}
          label="Beginning farmer"
          value={form.beginningFarmer}
          options={options.triStateBoolean}
          onChange={(beginningFarmer) => update({ beginningFarmer })}
        />
        <TriStateField
          id={`${idPrefix}-limited`}
          label="Limited-resource producer"
          value={form.limitedResourceProducer}
          options={options.triStateBoolean}
          onChange={(limitedResourceProducer) => update({ limitedResourceProducer })}
        />
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-county`}>County</Label>
          <Input
            id={`${idPrefix}-county`}
            value={form.county ?? ""}
            onChange={(e) => update({ county: e.target.value || null })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-state`}>State</Label>
          <Select value={form.state ?? NONE} onValueChange={(v) => update({ state: v === NONE ? null : v })}>
            <SelectTrigger id={`${idPrefix}-state`}>
              <SelectValue placeholder="Select state (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {INQUIRY_US_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SelectField
          id={`${idPrefix}-rural`}
          label="Rural or urban community"
          value={form.ruralUrban}
          options={options.ruralUrban}
          onChange={(ruralUrban) => update({ ruralUrban })}
        />
        <SelectField
          id={`${idPrefix}-academic`}
          label="Academic level"
          value={form.academicLevel}
          options={options.academicLevel}
          onChange={(academicLevel) => update({ academicLevel: (academicLevel as AcademicLevel) ?? null })}
        />
        {showInstitution && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Institution</Label>
            <InstitutionCombobox
              institutions={institutions}
              value={form.institutionId ?? ""}
              onValueChange={(institutionId) => update({ institutionId: institutionId || null })}
            />
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border p-4">
        <Checkbox
          id={`${idPrefix}-consent`}
          checked={form.consent}
          onCheckedChange={(checked) => update({ consent: checked === true })}
        />
        <Label htmlFor={`${idPrefix}-consent`} className="leading-relaxed">
          I consent to JESUP collecting the optional demographic information I provided, for aggregate reporting
          purposes only.
        </Label>
      </div>
    </div>
  );
}
