import { FC135, eventLocalToUtc } from "./conference";
import { FC135_PLANNING_PROVENANCE } from "./event-agenda-status";

// Only the explicitly supplied 134th-program blocks; missing/ambiguous blocks are not inferred.
const referenceBlocks = [
  ["18", "08:00", "08:45", "Breakfast / arrival planning block", "Breakfast arrangements and registration opening are not confirmed."],
  ["18", "09:00", "09:30", "Opening remarks", "Opening program; speakers and hosts unassigned."],
  ["18", "09:30", "11:00", "ANR / FCS stakeholder listening session", "Stakeholder listening; facilitators unassigned."],
  ["18", "11:15", "12:00", "Session I · ANR: Beef strategies", "Parallel track; speakers unassigned."],
  ["18", "11:15", "12:00", "Session I · Consumer beef", "Parallel track; speakers unassigned."],
  ["18", "11:15", "12:00", "Session I · 2FAS: Agri-business", "Parallel track; speakers unassigned."],
  ["18", "11:15", "12:00", "Session I · FCS: Nourishment", "Parallel track; speakers unassigned."],
  ["18", "11:15", "12:00", "Session I · Small-ruminant care", "Parallel track; speakers unassigned."],
  ["18", "12:15", "13:00", "Session II · FCS: Financial literacy / AI tools", "Parallel track; speakers unassigned."],
  ["18", "12:15", "13:00", "Session II · Produce on limited space", "Parallel track; speakers unassigned."],
  ["18", "12:15", "13:00", "Session II · Agroforestry", "Parallel track; speakers unassigned."],
  ["18", "12:15", "13:00", "Session II · Bees", "Parallel track; speakers unassigned."],
  ["19", "08:00", "08:45", "Breakfast planning block", "Meal arrangements are not confirmed."],
  ["19", "10:15", "11:00", "Session IV · Technology: AI basics", "Parallel track; speakers unassigned."],
  ["19", "10:15", "11:00", "Session IV · Posters / abstracts", "Parallel track; presenters unassigned."],
  ["19", "10:15", "11:00", "Session IV · Exhibitions and tours", "Exhibitors, hosts, access arrangements and routes are not confirmed."],
  ["19", "10:15", "12:00", "ANR farm tour planning block", "2026 topics: vegetables, beef, small ruminants / agroforestry. Routes, transport, hosts and access are not confirmed."],
  ["19", "11:15", "12:00", "Session V · AI applications", "Parallel track; speakers unassigned."],
  ["19", "11:15", "12:00", "Session V · Leadership", "Parallel track; speakers unassigned."],
  ["19", "11:15", "12:00", "Session V · Posters / exhibitions", "Presenters and exhibitors unassigned."],
  ["19", "12:30", "15:30", "BBQ / Taste of Black Belt · planning reference", "2026 activity reference only. A 2027 activity, menu, pricing, service and access have not been confirmed."],
] as const;

export function fc135PlanningSessions(eventId: string) {
  return referenceBlocks.map(([day, start, end, title, detail], index) => ({
    event_id: eventId,
    title,
    description: `${FC135_PLANNING_PROVENANCE}. Proposed time only. ${detail} Venue unassigned.`,
    starts_at: eventLocalToUtc(`2027-02-${day}T${start}`, FC135.timezone),
    ends_at: eventLocalToUtc(`2027-02-${day}T${end}`, FC135.timezone),
    location: null,
    sort_order: index,
  }));
}