const DEFAULT_DRAFT_AGENDA_NOTICE =
  "This preliminary agenda is provided for planning purposes. Session details may change until organizers publish the final schedule.";

export const FC135_PLANNING_PROVENANCE = "Planning draft adapted from 134th program; 2027 details subject to change";

export function isDraftAgenda(metadata: Record<string, unknown> | null | undefined) {
  return metadata?.agenda_status === "draft_placeholder" || metadata?.agenda_status === "provisional";
}

export function getDraftAgendaNotice(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata || !isDraftAgenda(metadata)) return null;

  return typeof metadata.agenda_notice === "string" && metadata.agenda_notice.trim()
    ? metadata.agenda_notice.trim()
    : DEFAULT_DRAFT_AGENDA_NOTICE;
}
