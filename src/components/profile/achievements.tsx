import { useQuery } from "@tanstack/react-query";
import { Award, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { productDb } from "@/lib/product-db";

export function Achievements() {
  const { user } = useAuth();
  const { data: achievements = [] } = useQuery({
    queryKey: ["jesup-achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await productDb
        .from("jesup_achievements")
        .select("*")
        .eq("user_id", user!.id)
        .order("awarded_at", { ascending: false });
      if (error?.code === "PGRST205" || error?.code === "42P01") return [];
      if (error) throw error;
      return data ?? [];
    },
  });
  const totalXp = achievements.reduce((sum, item) => sum + item.xp, 0);
  return (
    <section aria-labelledby="achievements-heading" className="mt-7 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <Award className="h-6 w-6 text-primary" />
        <h2 id="achievements-heading" className="text-xl font-black">
          Achievements
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {achievements.length} earned · {totalXp} XP
      </p>
      {achievements.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Your learning and event achievements will appear here as they are awarded.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {achievements.map((item) => (
            <li key={item.id} className="rounded-xl border p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-2 font-bold">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              )}
              <p className="mt-2 text-xs font-semibold text-muted-foreground">+{item.xp} XP</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
