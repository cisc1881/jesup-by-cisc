import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { productDb } from "@/lib/product-db";
import { recommendHomeContent } from "@/lib/recommendations";
import type { HomeEvent, HomeProgram } from "@/lib/home";

export function PersonalizedRecommendations({
  events,
  programs,
}: {
  events: HomeEvent[];
  programs: HomeProgram[];
}) {
  const { user } = useAuth();
  const { data: preferences } = useQuery({
    queryKey: ["jesup-preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await productDb
        .from("jesup_preferences")
        .select("role,interests")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error?.code === "PGRST205" || error?.code === "42P01") return null;
      if (error) throw error;
      return data;
    },
  });
  const recommendations = preferences ? recommendHomeContent(preferences, events, programs) : [];
  if (recommendations.length === 0) return null;
  return (
    <section aria-labelledby="recommendations-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 id="recommendations-heading" className="text-2xl font-black">
          Recommended for you
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((item) => (
          <a
            key={`${item.type}-${item.id}`}
            href={item.href}
            className="flex min-h-24 items-center gap-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] hover:bg-muted/50"
          >
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {item.type} · {item.reason}
              </p>
              <h3 className="mt-1 font-bold">{item.title}</h3>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </a>
        ))}
      </div>
    </section>
  );
}
