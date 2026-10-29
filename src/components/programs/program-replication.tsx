import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CopyCheck, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { productDb } from "@/lib/product-db";
import type { Json } from "@/integrations/supabase/types";

function textItems(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function ProgramReplication({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const { isAdmin } = useAuth();
  const { data: guide } = useQuery({
    queryKey: ["program-replication", programId],
    queryFn: async () => {
      const { data, error } = await productDb
        .from("program_replication_guides")
        .select("*")
        .eq("program_id", programId)
        .maybeSingle();
      if (error?.code === "PGRST205" || error?.code === "42P01") return null;
      if (error) throw error;
      return data;
    },
  });
  if (!guide && !isAdmin) return null;
  const sections = guide
    ? ([
        ["Impact metrics", textItems(guide.impact_metrics)],
        ["Curriculum", textItems(guide.curriculum)],
        ["Resources", textItems(guide.resources)],
        ["Timeline", textItems(guide.timeline)],
        ["Outcome measures", textItems(guide.outcome_measures)],
      ] as const)
    : [];
  return (
    <section
      className="mt-14 rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8"
      aria-labelledby="replication-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Extend the impact
          </p>
          <h2 id="replication-heading" className="mt-2 text-2xl font-black">
            Replicate this program
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A practical guide for bringing {programName} to another community.
          </p>
        </div>
        <CopyCheck className="h-8 w-8 text-primary" />
      </div>
      {guide && (
        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          {sections
            .filter(([, items]) => items.length > 0)
            .map(([title, items]) => (
              <div key={title}>
                <h3 className="font-bold">{title}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          {guide.evaluation_methodology && (
            <div>
              <h3 className="font-bold">Evaluation methodology</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {guide.evaluation_methodology}
              </p>
            </div>
          )}
          {guide.budget &&
            typeof guide.budget === "object" &&
            !Array.isArray(guide.budget) &&
            Object.keys(guide.budget).length > 0 && (
              <div>
                <h3 className="font-bold">Budget</h3>
                <dl className="mt-2 space-y-1 text-sm">
                  {Object.entries(guide.budget).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
        </div>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        {guide?.contact_email && (
          <a
            href={`mailto:${guide.contact_email}?subject=${encodeURIComponent(`Replicate ${programName}`)}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground"
          >
            Contact {guide.contact_name ?? "the program team"}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {isAdmin && (
          <>
            <Link
              to="/admin/programs/$programId/replication"
              params={{ programId }}
              className="inline-flex min-h-11 items-center rounded-xl border px-5 font-bold"
            >
              Edit replication guide
            </Link>
            <Link
              to="/admin/programs/$programId/links"
              params={{ programId }}
              className="inline-flex min-h-11 items-center rounded-xl border px-5 font-bold"
            >
              Edit related content
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
