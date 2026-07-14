import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  TWOFAS_TRACKS,
  TWOFAS_TRACK_LABELS,
  type ApplicationStatus,
  type TwofasCohort,
  type TwofasTrack,
} from "@/lib/twofas";

export type TwofasApplicationFilters = {
  status?: ApplicationStatus;
  track?: TwofasTrack;
  cohortId?: string;
};

type Props = {
  filters: TwofasApplicationFilters;
  cohorts: TwofasCohort[];
  onChange: (filters: TwofasApplicationFilters) => void;
};

const ALL = "__all__";

export function TwofasApplicationFiltersBar({ filters, cohorts, onChange }: Props) {
  function setStatus(value: string) {
    onChange({ ...filters, status: value === ALL ? undefined : (value as ApplicationStatus) });
  }

  function setTrack(value: string) {
    onChange({ ...filters, track: value === ALL ? undefined : (value as TwofasTrack) });
  }

  function setCohort(value: string) {
    onChange({ ...filters, cohortId: value === ALL ? undefined : value });
  }

  function clearFilters() {
    onChange({});
  }

  const hasFilters = Boolean(filters.status || filters.track || filters.cohortId);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select value={filters.status ?? ALL} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Track</Label>
        <Select value={filters.track ?? ALL} onValueChange={setTrack}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All tracks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All tracks</SelectItem>
            {TWOFAS_TRACKS.map((track) => (
              <SelectItem key={track} value={track}>
                {TWOFAS_TRACK_LABELS[track]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Cohort</Label>
        <Select value={filters.cohortId ?? ALL} onValueChange={setCohort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All cohorts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cohorts</SelectItem>
            {cohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {cohort.name} ({cohort.year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
