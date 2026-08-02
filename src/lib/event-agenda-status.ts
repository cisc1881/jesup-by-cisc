const DEFAULT_DRAFT_AGENDA_NOTICE =
  "This preliminary agenda is provided for planning purposes. Session details may change until organizers publish the final schedule.";

export function getDraftAgendaNotice(metadata: Record<string, unknown> | null | undefined) {
  if (metadata?.agenda_status !== "draft_placeholder") return null;

  return typeof metadata.agenda_notice === "string" && metadata.agenda_notice.trim()
    ? metadata.agenda_notice.trim()
    : DEFAULT_DRAFT_AGENDA_NOTICE;
}
