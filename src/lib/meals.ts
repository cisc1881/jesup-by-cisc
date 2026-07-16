import { supabase } from "@/integrations/supabase/client";

export type EventMealDay = {
  id: string;
  eventId: string;
  serviceDate: string;
  label: string;
  allowance: number;
  isActive: boolean;
};

export type MealRedemptionResult = {
  attendeeName: string;
  eventTitle: string;
  mealLabel: string;
  usedCount: number;
  allowance: number;
  remaining: number;
};

export async function listEventMealDays(eventId: string): Promise<EventMealDay[]> {
  const { data, error } = await supabase
    .from("event_meal_days")
    .select("id, event_id, service_date, label, allowance_per_attendee, is_active")
    .eq("event_id", eventId)
    .order("service_date")
    .order("label");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    serviceDate: row.service_date,
    label: row.label,
    allowance: row.allowance_per_attendee,
    isActive: row.is_active,
  }));
}

export async function saveEventMealDay(input: {
  eventId: string;
  serviceDate: string;
  label: string;
  allowance: number;
}) {
  const { error } = await supabase.from("event_meal_days").insert({
    event_id: input.eventId,
    service_date: input.serviceDate,
    label: input.label.trim(),
    allowance_per_attendee: input.allowance,
  });
  if (error) throw error;
}

export async function setMealDayActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("event_meal_days").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function redeemMealTicket(mealDayId: string, ticketCode: string): Promise<MealRedemptionResult> {
  const { data, error } = await supabase.rpc("redeem_event_meal_ticket", {
    p_meal_day_id: mealDayId,
    p_ticket_code: ticketCode,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("Meal redemption was not recorded.");
  return {
    attendeeName: row.attendee_name,
    eventTitle: row.event_title,
    mealLabel: row.meal_label,
    usedCount: row.used_count,
    allowance: row.allowance,
    remaining: row.remaining,
  };
}

export async function getMealRedemptionCounts(mealDayId: string) {
  const { data, error } = await supabase
    .from("event_meal_redemptions")
    .select("id, redeemed_at, redemption_number, registration_id")
    .eq("meal_day_id", mealDayId)
    .order("redeemed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
