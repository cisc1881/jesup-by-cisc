import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, CheckCircle2, LogOut, ShieldCheck, Users } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { PageContainer, LoadingState, QueryErrorState } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type FunderGrant = {
  id: string;
  title: string;
  funder: string | null;
  amount: string | null;
  deadline: string | null;
  events: number;
  registrations: number;
  checked_in: number;
  evaluations: number;
};

export const Route = createFileRoute("/_authenticated/funder/")({ component: FunderDashboard });

function FunderDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["funder-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_funder_dashboard");
      if (error) throw error;
      return data as { grants: FunderGrant[]; privacy: string };
    },
  });
  const grants = data?.grants ?? [];
  const totals = grants.reduce(
    (result, grant) => ({
      events: result.events + grant.events,
      registrations: result.registrations + grant.registrations,
      checkedIn: result.checkedIn + grant.checked_in,
      evaluations: result.evaluations + grant.evaluations,
    }),
    { events: 0, registrations: 0, checkedIn: 0, evaluations: 0 },
  );

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Restricted reporting"
        title="Funder impact portal"
        description="Aggregate outcomes for grants assigned to your account. Attendee-level records and operational admin tools are never displayed."
        action={
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        }
      />
      <PageContainer size="lg" className="space-y-8 pb-bottom-nav">
        {isLoading ? (
          <LoadingState label="Loading grant metrics" />
        ) : isError ? (
          <QueryErrorState title="Couldn't load funder metrics" onRetry={() => refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Funded events", value: totals.events, icon: CalendarDays },
                { label: "Registrations", value: totals.registrations, icon: Users },
                { label: "Checked in", value: totals.checkedIn, icon: CheckCircle2 },
                { label: "Evaluations", value: totals.evaluations, icon: BarChart3 },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]"
                >
                  <metric.icon className="h-5 w-5 institution-accent-text" />
                  <div className="mt-4 text-3xl font-black text-foreground">{metric.value}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/50 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="h-5 w-5 institution-accent-text" />
              <span>
                Privacy protected: only aggregate grant metrics are available in this portal.
              </span>
            </div>
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground">Assigned grants</h2>
              {grants.length === 0 ? (
                <div className="rounded-3xl bg-card p-8 text-center text-muted-foreground">
                  No grants are assigned to this funder account yet.
                </div>
              ) : (
                grants.map((grant) => (
                  <article
                    key={grant.id}
                    className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-foreground">{grant.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {grant.funder}
                          {grant.amount ? ` · ${grant.amount}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                        {grant.events} events
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/70 pt-5 text-center">
                      <div>
                        <b className="block text-xl text-foreground">{grant.registrations}</b>
                        <span className="text-xs text-muted-foreground">Registered</span>
                      </div>
                      <div>
                        <b className="block text-xl text-foreground">{grant.checked_in}</b>
                        <span className="text-xs text-muted-foreground">Attended</span>
                      </div>
                      <div>
                        <b className="block text-xl text-foreground">{grant.evaluations}</b>
                        <span className="text-xs text-muted-foreground">Evaluated</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
            <Link to="/me" className="inline-flex text-sm font-bold institution-accent-text">
              Open My JESUP profile
            </Link>
          </>
        )}
      </PageContainer>
    </PublicLayout>
  );
}
