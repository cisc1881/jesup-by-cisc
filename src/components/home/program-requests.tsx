import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function ProgramRequests() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["home-program-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id,status,programs(name,slug)")
        .eq("user_id", user!.id)
        .eq("inquiry_type", "join_program")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []).filter((row) => row.programs);
    },
  });
  if (!data.length) return null;
  return (
    <section aria-labelledby="program-requests-title" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Your learning</p>
        <h2 id="program-requests-title" className="mt-1 text-2xl font-black">
          Program requests
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((row) => (
          <Link
            key={row.id}
            to="/programs/$slug"
            params={{ slug: row.programs!.slug }}
            className="flex min-h-24 items-center gap-3 border border-border bg-card p-4 shadow-[var(--shadow-soft)] hover:border-primary"
          >
            <GraduationCap className="h-6 w-6 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block truncate font-bold">{row.programs!.name}</span>
              <span className="mt-1 block text-xs capitalize text-muted-foreground">
                Request {row.status.replaceAll("_", " ")}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
