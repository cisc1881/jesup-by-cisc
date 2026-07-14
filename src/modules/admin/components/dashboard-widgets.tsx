import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardCounts } from "../services/dashboard";
import { DASHBOARD_WIDGETS } from "../config/nav-items";

const WIDGET_GROUPS = [
  { id: "content" as const, label: "Content" },
  { id: "operations" as const, label: "Operations" },
  { id: "platform" as const, label: "Platform" },
];

type DashboardWidgetsProps = {
  counts: DashboardCounts | undefined;
  isLoading?: boolean;
};

export function DashboardWidgets({ counts, isLoading }: DashboardWidgetsProps) {
  return (
    <div className="space-y-8">
      {WIDGET_GROUPS.map((group) => {
        const widgets = DASHBOARD_WIDGETS.filter((w) => w.group === group.id);
        return (
          <section key={group.id}>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">{group.label}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {widgets.map((widget) => (
                <Link key={widget.key} to={widget.to}>
                  <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <span>{widget.label}</span>
                        <widget.icon className="h-4 w-4 text-accent" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-serif text-3xl font-bold text-primary">
                        {isLoading ? "—" : (counts?.[widget.key] ?? "—")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
