import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/twofas";

const STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  reviewed: "outline",
  under_review: "outline",
  accepted: "default",
  waitlisted: "outline",
  rejected: "destructive",
  active: "default",
  completed: "default",
  withdrawn: "destructive",
};

export function TwofasApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
