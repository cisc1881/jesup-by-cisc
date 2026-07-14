import { supabase } from "@/integrations/supabase/client";
import type { ContentTag } from "./types";

export function slugifyTag(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function fetchContentTags(): Promise<ContentTag[]> {
  const { data, error } = await supabase.from("content_tags").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, slug: row.slug }));
}

export async function createContentTag(name: string): Promise<ContentTag> {
  const slug = slugifyTag(name);
  const { data, error } = await supabase
    .from("content_tags")
    .insert({ name: name.trim(), slug })
    .select("*")
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, slug: data.slug };
}

export async function fetchEntityTags(entityType: string, entityId: string): Promise<ContentTag[]> {
  const { data, error } = await supabase
    .from("content_tag_links")
    .select("tag_id, content_tags ( id, name, slug )")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const tag = row.content_tags as { id: string; name: string; slug: string };
    return { id: tag.id, name: tag.name, slug: tag.slug };
  });
}

export async function saveEntityTags(entityType: string, entityId: string, tagIds: string[]) {
  await supabase.from("content_tag_links").delete().eq("entity_type", entityType).eq("entity_id", entityId);
  if (tagIds.length === 0) return;
  const { error } = await supabase.from("content_tag_links").insert(
    tagIds.map((tagId) => ({ tag_id: tagId, entity_type: entityType, entity_id: entityId })),
  );
  if (error) throw error;
}
