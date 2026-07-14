import type { ProgramListItem } from "@/lib/programs";
import { cn } from "@/lib/utils";

type ProgramStatisticsProps = {
  program: Pick<
    ProgramListItem,
    "publicationCount" | "eventCount" | "podcastCount" | "partnerCount"
  >;
  variant?: "hero" | "card" | "compact" | "rich";
  className?: string;
};

function formatStat(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ProgramStatistics({ program, variant = "card", className }: ProgramStatisticsProps) {
  const allItems = [
    formatStat(program.publicationCount, "Publication", "Publications"),
    formatStat(program.eventCount, "Event", "Events"),
    formatStat(program.podcastCount, "Podcast", "Podcasts"),
    formatStat(program.partnerCount, "Partner", "Partners"),
  ];

  const items = variant === "rich" ? allItems.slice(0, 3) : allItems;

  return (
    <div
      className={cn(
        "flex flex-wrap font-semibold",
        variant === "hero" && "gap-x-5 gap-y-1 text-sm text-white/90",
        variant === "rich" && "gap-x-3 gap-y-1 text-[11px] text-white/85",
        variant === "card" && "gap-x-4 gap-y-1 text-sm text-foreground/80",
        variant === "compact" && "gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
