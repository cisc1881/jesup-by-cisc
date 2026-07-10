import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstitutionCombobox } from "@/components/institutions/institution-combobox";
import {
  INSTITUTION_TYPE_LABELS,
  isOtherInstitution,
  type Institution,
  type InstitutionSelection,
  type InstitutionType,
} from "@/lib/institutions";

type InstitutionFieldsProps = {
  institutions: Institution[];
  value: InstitutionSelection;
  onChange: (value: InstitutionSelection) => void;
  errors?: Partial<Record<"institutionId" | "schoolName" | "institutionType", string>>;
  idPrefix?: string;
  requiredSchoolName?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export function InstitutionFields({
  institutions,
  value,
  onChange,
  errors,
  idPrefix = "institution",
  requiredSchoolName = false,
  helperText = "Tuskegee University, all 1890 land-grant institutions, and other schools are welcome.",
  disabled = false,
}: InstitutionFieldsProps) {
  const selectedInstitution = institutions.find((row) => row.id === value.institutionId) ?? null;
  const showOtherSchool = !!selectedInstitution && isOtherInstitution(selectedInstitution);

  function handleInstitutionChange(institutionId: string) {
    const institution = institutions.find((row) => row.id === institutionId) ?? null;
    onChange({
      institutionId,
      institutionType:
        institution && !isOtherInstitution(institution) ? institution.institutionType : value.institutionType,
      schoolName: institution && !isOtherInstitution(institution) ? "" : value.schoolName,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-picker`}>Institution</Label>
        <InstitutionCombobox
          id={`${idPrefix}-picker`}
          institutions={institutions}
          value={value.institutionId}
          onValueChange={handleInstitutionChange}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">{helperText}</p>
      </div>

      {showOtherSchool && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-school`}>
              School or organization name{requiredSchoolName ? " *" : ""}
            </Label>
            <Input
              id={`${idPrefix}-school`}
              value={value.schoolName}
              onChange={(e) => onChange({ ...value, schoolName: e.target.value })}
              aria-invalid={!!errors?.schoolName}
              aria-describedby={errors?.schoolName ? `${idPrefix}-school-error` : undefined}
              disabled={disabled}
            />
            {errors?.schoolName && (
              <p id={`${idPrefix}-school-error`} className="text-sm text-destructive" role="alert">
                {errors.schoolName}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-type`}>Institution type</Label>
            <Select
              value={value.institutionType || "none"}
              onValueChange={(next) =>
                onChange({
                  ...value,
                  institutionType: next === "none" ? "" : (next as InstitutionType),
                })
              }
              disabled={disabled}
            >
              <SelectTrigger id={`${idPrefix}-type`}>
                <SelectValue placeholder="Select institution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {(Object.keys(INSTITUTION_TYPE_LABELS) as InstitutionType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {INSTITUTION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
