import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { COMMAND_CENTER_TITLE, DashboardWidgets, fetchDashboardCounts } from "@/modules/admin";

export const Route = createFileRoute("/_authenticated/admin/")({ component: CommandCenterHome });

function CommandCenterHome() {
  const { data: counts, isLoading } = useQuery({
    queryKey: ["command-center-counts"],
    queryFn: fetchDashboardCounts,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <span className="gold-bar mb-3" />
      <h1 className="font-serif text-3xl font-bold text-primary">{COMMAND_CENTER_TITLE}</h1>
      <p className="mt-1 text-muted-foreground">
        Digital platform for Cooperative Extension — programs, events, markets, and community impact.
      </p>
      <div className="mt-8">
        <DashboardWidgets counts={counts} isLoading={isLoading} />
      </div>
    </div>
  );
}
