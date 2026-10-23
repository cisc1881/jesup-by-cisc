import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Clock } from "lucide-react";
import type { EventDetail } from "@/lib/events";
import { countdownParts, sessionCountdown } from "@/lib/speakers";
import { isDraftAgenda } from "@/lib/event-agenda-status";

/**
 * Live "next session" countdown for events with a confirmed agenda.
 * Hidden entirely when the agenda is provisional/draft, when the event has no
 * timed sessions, once every session has ended, or when an admin sets
 * metadata.countdown_enabled to false.
 */
export function NextSessionCountdown({ event }: { event: EventDetail }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isDraftAgenda(event.metadata)) return null;
  if (event.metadata.countdown_enabled === false) return null;
  if (!now) return null;

  const state = sessionCountdown(event.sessions, now);
  if (state.kind === "none" || state.kind === "after") return null;

  const timezone = event.timezone || "America/Chicago";
  const tzLabel = timezone.replaceAll("_", " ");

  return (
    <section
      aria-labelledby="next-session-heading"
      className="relative isolate overflow-hidden rounded-3xl shadow-token-crimson"
    >
      <div className="absolute inset-0 grad-crimson" aria-hidden="true" />
      <div className="relative z-10 p-6 sm:p-8">
        {state.kind === "now" ? (
          <>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
              <Clock className="h-4 w-4" /> Happening now
            </p>
            <h2 id="next-session-heading" className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {state.sessions.map((s) => s.title).join(" · ")}
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/85">
              {state.sessions
                .map((s) =>
                  s.endsAt
                    ? `Until ${formatInTimeZone(s.endsAt, timezone, "h:mm a")}`
                    : "In progress",
                )
                .join(" · ")}{" "}
              ({tzLabel})
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
              <Clock className="h-4 w-4" /> Next session
            </p>
            <h2 id="next-session-heading" className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {state.sessions.map((s) => s.title).join(" · ")}
            </h2>
            <p className="mt-1 text-sm font-semibold text-white/85">
              {formatInTimeZone(state.startsAt, timezone, "EEEE, MMMM d · h:mm a")} ({tzLabel})
              {state.sessions.length > 1 && ` · ${state.sessions.length} simultaneous sessions`}
            </p>
            <CountdownNumbers target={state.startsAt} now={now} />
          </>
        )}
      </div>
    </section>
  );
}

function CountdownNumbers({ target, now }: { target: Date; now: Date }) {
  const parts = countdownParts(target, now);
  const units: Array<[number, string]> = [
    [parts.days, "days"],
    [parts.hours, "hrs"],
    [parts.minutes, "min"],
    [parts.seconds, "sec"],
  ];
  return (
    <div className="mt-4 flex gap-3" role="timer" aria-label="Time until the next session">
      {units.map(([value, label]) => (
        <div
          key={label}
          className="min-w-16 rounded-2xl bg-black/25 px-3 py-2 text-center backdrop-blur-sm"
        >
          <div className="text-2xl font-black tabular-nums text-white sm:text-3xl">
            {String(value).padStart(2, "0")}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
