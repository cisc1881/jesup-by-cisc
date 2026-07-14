import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DEMOGRAPHIC_CATEGORY_LABELS,
  formatDemographicLabel,
  getEventDemographicAggregates,
  groupDemographicAggregates,
} from "@/lib/demographics";
import { eventDemographicAggregatesQueryKey } from "@/lib/query-config";

type DemographicAggregateCardsProps = {
  eventId: string;
};

export function DemographicAggregateCards({ eventId }: DemographicAggregateCardsProps) {
  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: eventDemographicAggregatesQueryKey(eventId),
    queryFn: () => getEventDemographicAggregates(eventId),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading demographic summaries…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Demographic aggregates are unavailable until the aggregate reporting migration is applied.
      </p>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  const groups = groupDemographicAggregates(rows);

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Demographic summaries (aggregate only)</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {[...groups.entries()].map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {DEMOGRAPHIC_CATEGORY_LABELS[category] ?? category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div key={`${category}-${item.valueLabel}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatDemographicLabel(category, item.valueLabel)}
                  </span>
                  {item.suppressed ? (
                    <Badge variant="secondary">Fewer than 5</Badge>
                  ) : (
                    <span className="font-medium">{item.count}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
