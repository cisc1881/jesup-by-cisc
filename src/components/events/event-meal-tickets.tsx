import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Soup } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function EventMealTickets({
  eventId,
  registrationId,
}: {
  eventId: string;
  registrationId?: string | null;
}) {
  const { data: days = [] } = useQuery({
    queryKey: ["event-meal-days-public", eventId, registrationId],
    enabled: !!registrationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_meal_days")
        .select("id,label,service_date,allowance_per_attendee")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("service_date");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: redemptions = [] } = useQuery({
    queryKey: ["event-meal-redemptions-own", registrationId],
    enabled: !!registrationId && days.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_meal_redemptions")
        .select("meal_day_id")
        .eq("registration_id", registrationId!);
      if (error) throw error;
      return data ?? [];
    },
  });
  if (days.length === 0) return null;
  return (
    <section
      id="event-meals"
      className="scroll-mt-24 rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)]"
      aria-labelledby="meal-tickets-heading"
    >
      <div className="flex items-center gap-2">
        <Soup className="h-6 w-6 text-primary" />
        <h2 id="meal-tickets-heading" className="text-xl font-black">
          Meal tickets
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Present your event QR credential at meal service. Each redemption is recorded against your
        registration.
      </p>
      <ul className="mt-4 divide-y">
        {days.map((day) => {
          const used = redemptions.filter((item) => item.meal_day_id === day.id).length;
          return (
            <li key={day.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-bold">{day.label}</p>
                <p className="text-xs text-muted-foreground">{day.service_date}</p>
              </div>
              <p className="text-sm font-semibold">
                {Math.max(0, day.allowance_per_attendee - used)} of {day.allowance_per_attendee}{" "}
                remaining
              </p>
            </li>
          );
        })}
      </ul>
      <Link
        to="/me/wallet"
        className="mt-4 inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold"
      >
        Open my QR
      </Link>
    </section>
  );
}
