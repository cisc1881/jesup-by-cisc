import { CloudOff } from "lucide-react";
import { EmptyState } from "@/components/design-system";

export function WeatherEmptyState() {
  return (
    <EmptyState
      icon={CloudOff}
      title="Weather unavailable"
      description="Conditions and alerts will appear here when a live weather source is connected."
    />
  );
}
