import { TriangleAlert } from "lucide-react";
import { getDraftAgendaNotice } from "@/lib/event-agenda-status";

export function EventAgendaNotice({ metadata }: { metadata: Record<string, unknown> }) {
  const notice = getDraftAgendaNotice(metadata);
  if (!notice) return null;

  return (
    <div
      role="status"
      aria-label="Preliminary agenda notice"
      className="border-l-4 border-primary bg-secondary px-4 py-3 text-secondary-foreground"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-black">{metadata.agenda_status === "provisional" ? "Provisional planning agenda" : "Preliminary agenda"}</p>
          {typeof metadata.agenda_provenance === "string" && metadata.agenda_provenance.trim() && <p className="mt-1 text-sm font-semibold">{metadata.agenda_provenance}</p>}
          <p className="mt-1 text-sm leading-relaxed">{notice}</p>
        </div>
      </div>
    </div>
  );
}
