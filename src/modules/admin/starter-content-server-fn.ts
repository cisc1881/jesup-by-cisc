import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const importStarterContentServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!role) throw new Error("Forbidden: admin role required.");

    const {
      starterEvents,
      starterNews,
      starterMarkets,
      starterPodcasts,
      starterInternships,
    } = await import("./starter-content");
    const {
      starterEquipment,
      starterGrants,
      starterInstitutionEvents,
      starterProgramWorkshops,
      starterPublications,
      starterSurveys,
    } = await import("./starter-network-content");
    const { data: institutions, error: institutionsError } = await context.supabase
      .from("institutions")
      .select("id, slug");
    if (institutionsError) throw new Error(`institutions: ${institutionsError.message}`);
    const institutionIdsBySlug = new Map(
      (institutions ?? []).map((institution) => [institution.slug, institution.id]),
    );
    const targetedInstitutionEvents = starterInstitutionEvents.map((event) => {
      const metadata = (event.metadata ?? {}) as Record<string, unknown>;
      const institutionId = institutionIdsBySlug.get(String(metadata.institution_slug ?? ""));
      return {
        ...event,
        metadata: {
          ...metadata,
          institution_ids: institutionId ? [institutionId] : [],
          network_wide: false,
        },
      };
    });
    // The official partner roster and supplied brand assets are managed separately
    // so a starter-content refresh cannot overwrite approved logos or republish placeholders.
    const imports = [
      [
        "events",
        [...starterEvents, ...targetedInstitutionEvents, ...starterProgramWorkshops],
        "slug",
      ],
      ["news_articles", starterNews, "slug"],
      ["markets", starterMarkets, "slug"],
      ["podcast_episodes", starterPodcasts, "slug"],
      ["internships", starterInternships, "slug"],
      ["publications", starterPublications, "slug"],
      ["grants", starterGrants, "id"],
      ["equipment", starterEquipment, "id"],
      ["surveys", starterSurveys, "id"],
    ] as const;
    const result: Record<string, number> = {};
    for (const [table, rows, onConflict] of imports) {
      const { data, error } = await context.supabase
        .from(table)
        .upsert(rows as never, { onConflict })
        .select("id");
      if (error) throw new Error(`${table}: ${error.message}`);
      result[table] = data?.length ?? 0;
    }

    const programSlugs = starterProgramWorkshops.map((event) =>
      String((event.metadata as Record<string, unknown>).program_slug),
    );
    const eventSlugs = starterProgramWorkshops.map((event) => event.slug!);
    const [{ data: programs }, { data: events }] = await Promise.all([
      context.supabase.from("programs").select("id, slug").in("slug", programSlugs),
      context.supabase.from("events").select("id, slug").in("slug", eventSlugs),
    ]);
    const programsBySlug = new Map((programs ?? []).map((program) => [program.slug, program.id]));
    const eventsBySlug = new Map((events ?? []).map((event) => [event.slug, event.id]));
    const programEventLinks = starterProgramWorkshops.flatMap((event) => {
      const programSlug = String((event.metadata as Record<string, unknown>).program_slug);
      const programId = programsBySlug.get(programSlug);
      const eventId = eventsBySlug.get(event.slug!);
      return programId && eventId ? [{ program_id: programId, event_id: eventId }] : [];
    });
    if (programEventLinks.length > 0) {
      const { error: linksError } = await context.supabase
        .from("program_events")
        .upsert(programEventLinks, { onConflict: "program_id,event_id" });
      if (linksError) throw new Error(`program_events: ${linksError.message}`);
    }

    return result;
  });
