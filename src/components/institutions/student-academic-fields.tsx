import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACADEMIC_LEVEL_LABELS, type AcademicLevel } from "@/lib/institutions";

export type StudentAcademicValue = {
  academicLevel: AcademicLevel | "";
  major: string;
  graduationYear: string;
};

type StudentAcademicFieldsProps = {
  value: StudentAcademicValue;
  onChange: (value: StudentAcademicValue) => void;
  idPrefix?: string;
  disabled?: boolean;
};

export function StudentAcademicFields({
  value,
  onChange,
  idPrefix = "academic",
  disabled = false,
}: StudentAcademicFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-level`}>Academic level</Label>
        <Select
          value={value.academicLevel || "none"}
          onValueChange={(next) =>
            onChange({
              ...value,
              academicLevel: next === "none" ? "" : (next as AcademicLevel),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-level`}>
            <SelectValue placeholder="Select level (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not specified</SelectItem>
            {(Object.keys(ACADEMIC_LEVEL_LABELS) as AcademicLevel[]).map((level) => (
              <SelectItem key={level} value={level}>
                {ACADEMIC_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-major`}>Major or field of interest</Label>
          <Input
            id={`${idPrefix}-major`}
            value={value.major}
            onChange={(e) => onChange({ ...value, major: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-grad-year`}>Expected graduation year</Label>
          <Input
            id={`${idPrefix}-grad-year`}
            type="number"
            inputMode="numeric"
            min={1950}
            max={2100}
            value={value.graduationYear}
            onChange={(e) => onChange({ ...value, graduationYear: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
