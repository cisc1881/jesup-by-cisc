import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { productDb } from "@/lib/product-db";

export const Route = createFileRoute("/_authenticated/me/onboarding")({
  component: OnboardingPage,
});

const roles = [
  "farmer",
  "student",
  "researcher",
  "educator",
  "specialist",
  "organizer",
  "partner",
  "other",
] as const;
const interests = [
  "small farms",
  "food systems",
  "climate resilience",
  "youth",
  "agriculture",
  "health",
  "business",
  "research",
  "technology",
];

function OnboardingPage() {
  const { user } = useAuth();
  const [role, setRole] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { data: institutions = [] } = useQuery({
    queryKey: ["onboarding-institutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutions")
        .select("id,name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: preferences } = useQuery({
    queryKey: ["jesup-preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await productDb
        .from("jesup_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error?.code === "PGRST205" || error?.code === "42P01") return null;
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!preferences) return;
    setRole(preferences.role ?? "");
    setInstitutionId(preferences.institution_id ?? "");
    setSelected(preferences.interests ?? []);
  }, [preferences]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    const { error } = await productDb.from("jesup_preferences").upsert({
      user_id: user.id,
      role: role || null,
      institution_id: institutionId || null,
      interests: selected,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) toast.error("Preferences could not be saved. Please try again later.");
    else toast.success("Your Jesup preferences are saved.");
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Make Jesup yours"
        title="Your interests"
        description="Tell Jesup what matters to you. You can update these choices anytime."
      />
      <form
        onSubmit={(event) => void save(event)}
        className="mx-auto max-w-2xl space-y-7 px-4 py-8 pb-28 sm:px-6"
      >
        <label className="block text-sm font-bold">
          Your role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border bg-card px-3"
          >
            <option value="">Choose a role (optional)</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold">
          Institution
          <select
            value={institutionId}
            onChange={(event) => setInstitutionId(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border bg-card px-3"
          >
            <option value="">No institution selected</option>
            {institutions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-bold">Interests</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((interest) => (
              <label
                key={interest}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(interest)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, interest]
                        : current.filter((item) => item !== interest),
                    )
                  }
                />
                {interest}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="min-h-12 rounded-xl bg-primary px-6 font-bold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
          <Link to="/me" className="text-sm font-bold underline">
            Back to my Jesup
          </Link>
        </div>
      </form>
    </PublicLayout>
  );
}
