import { supabase } from "@/integrations/supabase/client";
import type { ContentEntityType } from "@/modules/core";
import type { RelationshipDef } from "./types";

/**
 * Config-driven relationship engine.
 * Maps entity types to existing junction tables — no code changes needed to connect content.
 */
export const RELATIONSHIP_REGISTRY: RelationshipDef[] = [
  { sourceType: "program", targetType: "event", junctionTable: "program_events", sourceColumn: "program_id", targetColumn: "event_id", label: "Events" },
  { sourceType: "program", targetType: "publication", junctionTable: "program_publications", sourceColumn: "program_id", targetColumn: "publication_id", label: "Publications" },
  { sourceType: "program", targetType: "podcast", junctionTable: "program_podcast_episodes", sourceColumn: "program_id", targetColumn: "podcast_episode_id", label: "Podcasts" },
  { sourceType: "program", targetType: "partner", junctionTable: "program_partners", sourceColumn: "program_id", targetColumn: "partner_id", label: "Partners" },
  { sourceType: "program", targetType: "grant", junctionTable: "program_grants", sourceColumn: "program_id", targetColumn: "grant_id", label: "Grants" },
  { sourceType: "event", targetType: "program", junctionTable: "program_events", sourceColumn: "event_id", targetColumn: "program_id", label: "Programs" },
  { sourceType: "event", targetType: "publication", junctionTable: "publication_events", sourceColumn: "event_id", targetColumn: "publication_id", label: "Publications" },
  { sourceType: "event", targetType: "podcast", junctionTable: "event_podcast_episodes", sourceColumn: "event_id", targetColumn: "podcast_episode_id", label: "Podcasts" },
  { sourceType: "event", targetType: "partner", junctionTable: "event_partners", sourceColumn: "event_id", targetColumn: "partner_id", label: "Partners" },
  { sourceType: "event", targetType: "grant", junctionTable: "event_grants", sourceColumn: "event_id", targetColumn: "grant_id", label: "Grants" },
  { sourceType: "publication", targetType: "program", junctionTable: "program_publications", sourceColumn: "publication_id", targetColumn: "program_id", label: "Programs" },
  { sourceType: "publication", targetType: "event", junctionTable: "publication_events", sourceColumn: "publication_id", targetColumn: "event_id", label: "Events" },
  { sourceType: "publication", targetType: "podcast", junctionTable: "publication_podcast_episodes", sourceColumn: "publication_id", targetColumn: "podcast_episode_id", label: "Podcasts" },
  { sourceType: "market", targetType: "event", junctionTable: "market_events", sourceColumn: "market_id", targetColumn: "event_id", label: "Events" },
  { sourceType: "market", targetType: "program", junctionTable: "market_programs", sourceColumn: "market_id", targetColumn: "program_id", label: "Programs" },
];

export function getRelationshipsFor(sourceType: ContentEntityType) {
  return RELATIONSHIP_REGISTRY.filter((r) => r.sourceType === sourceType);
}

export async function fetchRelatedIds(
  sourceType: ContentEntityType,
  sourceId: string,
  targetType: ContentEntityType,
): Promise<string[]> {
  const def = RELATIONSHIP_REGISTRY.find(
    (r) => r.sourceType === sourceType && r.targetType === targetType,
  );
  if (!def) return [];

  const { data, error } = await supabase
    .from(def.junctionTable)
    .select(def.targetColumn)
    .eq(def.sourceColumn, sourceId);
  if (error) throw error;
  return (data ?? []).map((row) => (row as Record<string, string>)[def.targetColumn]);
}

export async function saveRelationships(
  sourceType: ContentEntityType,
  sourceId: string,
  targetType: ContentEntityType,
  targetIds: string[],
) {
  const def = RELATIONSHIP_REGISTRY.find(
    (r) => r.sourceType === sourceType && r.targetType === targetType,
  );
  if (!def) return;

  await supabase.from(def.junctionTable).delete().eq(def.sourceColumn, sourceId);
  if (targetIds.length === 0) return;

  const { error } = await supabase.from(def.junctionTable).insert(
    targetIds.map((targetId, index) => ({
      [def.sourceColumn]: sourceId,
      [def.targetColumn]: targetId,
      sort_order: index,
    })),
  );
  if (error) throw error;
}

/** Fetch attachment options for a relationship picker in admin forms. */
export async function fetchRelationshipOptions(targetType: ContentEntityType) {
  const tableMap: Record<ContentEntityType, { table: string; idCol: string; labelCol: string; filter?: Record<string, unknown> }> = {
    program: { table: "programs", idCol: "id", labelCol: "name", filter: { is_active: true } },
    event: { table: "events", idCol: "id", labelCol: "title", filter: { is_active: true } },
    market: { table: "markets", idCol: "id", labelCol: "name", filter: { is_active: true } },
    publication: { table: "publications", idCol: "id", labelCol: "title", filter: { is_active: true } },
    podcast: { table: "podcast_episodes", idCol: "id", labelCol: "title" },
    partner: { table: "partners", idCol: "id", labelCol: "name" },
    grant: { table: "grants", idCol: "id", labelCol: "title" },
    equipment: { table: "equipment", idCol: "id", labelCol: "name" },
    survey: { table: "surveys", idCol: "id", labelCol: "title" },
    internship: { table: "internships", idCol: "id", labelCol: "title" },
  };

  const config = tableMap[targetType];
  if (!config) return [];

  let query = supabase.from(config.table).select(`${config.idCol}, ${config.labelCol}`).order(config.labelCol);
  if (config.filter) {
    for (const [col, val] of Object.entries(config.filter)) {
      query = query.eq(col, val);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: (row as Record<string, string>)[config.idCol],
    label: (row as Record<string, string>)[config.labelCol],
  }));
}

export async function fetchAllRelationshipOptions() {
  const types: ContentEntityType[] = ["program", "event", "publication", "podcast", "partner", "grant"];
  const entries = await Promise.all(types.map(async (type) => [type, await fetchRelationshipOptions(type)] as const));
  return Object.fromEntries(entries) as Record<ContentEntityType, { id: string; label: string }[]>;
}
