import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { productDb } from "@/lib/product-db";

export function EventChallenges({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const { data: challenges = [] } = useQuery({
    queryKey: ["event-challenges", eventId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await productDb
        .from("jesup_challenges")
        .select("id,title,description,kind,xp,target_count,starts_at,ends_at")
        .eq("event_id", eventId)
        .eq("is_published", true)
        .order("created_at");
      if (error?.code === "PGRST205" || error?.code === "42P01") return [];
      if (error) throw error;
      return (data ?? []).filter(
        (item) =>
          (!item.starts_at || item.starts_at <= now) && (!item.ends_at || item.ends_at >= now),
      );
    },
  });
  const { data: progress = [] } = useQuery({
    queryKey: ["event-challenge-progress", eventId, user?.id],
    enabled: !!user && challenges.length > 0,
    queryFn: async () => {
      const { data, error } = await productDb
        .from("jesup_challenge_progress")
        .select("challenge_id,current_count,completed_at")
        .eq("user_id", user!.id)
        .in(
          "challenge_id",
          challenges.map((item) => item.id),
        );
      if (error) throw error;
      return data ?? [];
    },
  });
  if (challenges.length === 0) return null;
  return (
    <section
      className="border-t-[6px] border-muted px-4 py-6 sm:px-6"
      aria-labelledby="event-challenges-heading"
    >
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 id="event-challenges-heading" className="text-xl font-black">
          Learning challenges
        </h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {challenges.map((challenge) => {
          const record = progress.find((item) => item.challenge_id === challenge.id);
          const count = Math.min(record?.current_count ?? 0, challenge.target_count);
          return (
            <article key={challenge.id} className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {challenge.kind} · {challenge.xp} XP
              </p>
              <h3 className="mt-2 font-bold">{challenge.title}</h3>
              {challenge.description && (
                <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
              )}
              {user && (
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  {record?.completed_at
                    ? "Completed"
                    : `${count} of ${challenge.target_count} completed`}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
