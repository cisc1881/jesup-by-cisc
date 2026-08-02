import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EligibilityBanner } from "@/components/institutions";
import { InternshipApplicationForm } from "@/components/internships/internship-application-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDate } from "@/lib/format";
import { Briefcase } from "lucide-react";
import { listPageHead } from "@/lib/seo";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import {
  InstitutionScopeFilter,
  type InstitutionScope,
} from "@/components/institution-scope-filter";
import { listInstitutions } from "@/lib/institutions";
import { parseInternshipAudience } from "@/lib/internships";

export const Route = createFileRoute("/internships")({
  head: () =>
    listPageHead({
      title: "Internships",
      description: "Open internship positions and student opportunities at CISC.",
      path: "/internships",
    }),
  component: InternshipsPage,
});

function InternshipsPage() {
  const { user } = useAuth();
  const { institutionId, institutionName } = useInstitutionTheme();
  const [scope, setScope] = useState<InstitutionScope>(institutionId ? "mine" : "all");
  const { data } = useQuery({
    queryKey: ["internships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .eq("is_open", true)
        .order("deadline", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["institutions", "internship-directory"],
    queryFn: () => listInstitutions({ activeOnly: true, includeOther: true }),
  });

  const { data: applicationIds = [] } = useQuery({
    queryKey: ["my-internship-application-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internship_applications")
        .select("internship_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((row) => row.internship_id);
    },
  });
  const applied = new Set(applicationIds);

  const selectedInstitution = institutions.find((institution) => institution.id === institutionId);
  const filtered = (data ?? []).filter((internship) => {
    if (scope === "all" || !institutionId) return true;
    const audience = parseInternshipAudience((internship as { metadata?: import("@/integrations/supabase/types").Json }).metadata);
    const belongsToMine =
      audience.institutionIds.includes(institutionId) ||
      (!!selectedInstitution && audience.institutionSlugs.includes(selectedInstitution.slug));
    if (scope === "mine") return audience.networkWide || belongsToMine;
    return audience.otherInstitutions || (!audience.networkWide && !belongsToMine);
  });
  const has2fas = filtered.some((row) => row.is_2fas);

  return (
    <PublicLayout>
      <PageHeader
        eyebrow={institutionName ?? "1890 Land-Grant Network"}
        title="Internship Applications"
        description="Search and apply for internships across your institution and the shared 1890 network."
      />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <InstitutionScopeFilter
          value={scope}
          onChange={setScope}
          hasInstitution={!!institutionId}
        />
        <EligibilityBanner />
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.length === 0 && (
            <p className="text-muted-foreground md:col-span-2">No open internships at this time.</p>
          )}
          {filtered.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              showEligibility={has2fas && internship.is_2fas}
              hasApplied={applied.has(internship.id)}
            />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

type InternshipRow = {
  id: string;
  title: string;
  description: string | null;
  department: string | null;
  deadline: string | null;
  is_2fas: boolean;
  metadata?: import("@/integrations/supabase/types").Json;
};

function InternshipCard({
  internship,
  showEligibility,
  hasApplied,
}: {
  internship: InternshipRow;
  showEligibility: boolean;
  hasApplied: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        {internship.department && (
          <div className="mt-3 text-xs font-medium uppercase tracking-wider text-accent">
            {internship.department}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h3 className="font-serif text-lg font-semibold text-primary">{internship.title}</h3>
          {internship.is_2fas && <Badge variant="secondary">2FAS</Badge>}
        </div>
        {internship.description && (
          <p className="mt-2 text-sm text-muted-foreground">{internship.description}</p>
        )}
        {internship.deadline && (
          <p className="mt-2 text-sm text-muted-foreground">
            Apply by {fmtDate(internship.deadline)}
          </p>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="mt-4 bg-primary hover:bg-primary/90"
              disabled={hasApplied}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  navigate({ to: "/auth", search: { next: "/internships" } });
                }
              }}
            >
              {hasApplied ? "Application submitted" : user ? "Apply" : "Sign in to apply"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply · {internship.title}</DialogTitle>
            </DialogHeader>
            {showEligibility && <EligibilityBanner className="mb-2" />}
            <InternshipApplicationForm
              internshipId={internship.id}
              internshipTitle={internship.title}
              is2fas={internship.is_2fas}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
