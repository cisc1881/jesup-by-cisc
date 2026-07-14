import { useMemo, useState } from "react";
import type { EventListItem } from "@/lib/events";
import { AppBadge } from "@/components/design-system";
import { cn } from "@/lib/utils";

type EventCalendarViewProps = {
  events: EventListItem[];
  className?: string;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function EventCalendarView({ events, className }: EventCalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const eventsByDay = useMemo(() => {
    const map = new Map<number, EventListItem[]>();
    for (const event of events) {
      const d = new Date(event.startsAt);
      if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) continue;
      const day = d.getDate();
      map.set(day, [...(map.get(day) ?? []), event]);
    }
    return map;
  }, [events, month]);

  const firstWeekday = startOfMonth(month).getDay();
  const totalDays = daysInMonth(month);
  const cells = Array.from({ length: firstWeekday + totalDays }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= totalDays ? day : null;
  });

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-border/60 bg-card p-4 shadow-token-soft sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black tracking-[var(--tracking-tight)] text-foreground">
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full glass-surface px-3 py-1.5 text-sm font-semibold"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-full glass-surface px-3 py-1.5 text-sm font-semibold"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            Next
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((day, index) => {
          const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
          return (
            <div
              key={index}
              className={cn(
                "min-h-20 rounded-2xl border border-border/40 p-2 text-left",
                day ? "bg-background/70" : "border-transparent bg-transparent",
                dayEvents.length > 0 && "border-primary/20 bg-primary/5",
              )}
            >
              {day && <div className="text-sm font-bold text-foreground">{day}</div>}
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <AppBadge key={event.id} variant="gold" className="block truncate text-[10px]">
                    {event.title}
                  </AppBadge>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[10px] font-semibold text-muted-foreground">+{dayEvents.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
