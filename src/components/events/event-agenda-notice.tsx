import { TriangleAlert } from "lucide-react";
import { getDraftAgendaNotice } from "@/lib/event-agenda-status";

export function EventAgendaNotice({ metadata }: { metadata: Record<string, unknown> }) {
  const notice = getDraftAgendaNotice(metadata);
  if (!notice) return null;

  return (
    <div
      role="status"
      aria-label="Preliminary agenda notice"
      className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-black">Preliminary agenda</p>
          <p className="mt-1 text-sm leading-relaxed">{notice}</p>
        </div>
      </div>
    </div>
  );
}
