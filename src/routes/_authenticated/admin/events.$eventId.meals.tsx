import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Plus, Utensils } from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { QrTicketScanner } from "@/components/admin/qr-ticket-scanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchEventAttendanceHeader } from "@/lib/attendance";
import {
  getMealRedemptionCounts,
  listEventMealDays,
  redeemMealTicket,
  saveEventMealDay,
  setMealDayActive,
} from "@/lib/meals";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/events/$eventId/meals")({
  component: EventMealsPage,
});

function EventMealsPage() {
  const { eventId } = Route.useParams();
  const qc = useQueryClient();
  const [serviceDate, setServiceDate] = useState("");
  const [label, setLabel] = useState("Daily meals");
  const [allowance, setAllowance] = useState("2");
  const [activeDayId, setActiveDayId] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [lastResult, setLastResult] = useState<Awaited<ReturnType<typeof redeemMealTicket>> | null>(null);

  const { data: header } = useQuery({
    queryKey: ["event-attendance-header", eventId],
    queryFn: () => fetchEventAttendanceHeader(eventId),
  });
  const { data: days = [] } = useQuery({
    queryKey: ["event-meal-days", eventId],
    queryFn: () => listEventMealDays(eventId),
  });
  const { data: redemptions = [] } = useQuery({
    queryKey: ["event-meal-redemptions", activeDayId],
    enabled: Boolean(activeDayId),
    queryFn: () => getMealRedemptionCounts(activeDayId),
  });

  async function addDay() {
    if (!serviceDate || !label.trim()) return toast.error("Enter the service date and meal label.");
    const quantity = Number(allowance);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return toast.error("Allowance must be 1–10.");
    setSaving(true);
    try {
      await saveEventMealDay({ eventId, serviceDate, label, allowance: quantity });
      await qc.invalidateQueries({ queryKey: ["event-meal-days", eventId] });
      toast.success("Meal allowance added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add meal allowance");
    } finally {
      setSaving(false);
    }
  }

  async function redeem(code: string) {
    if (!activeDayId) return toast.error("Select the active meal service first.");
    if (!code.trim()) return toast.error("Scan or enter an attendee code.");
    setRedeeming(true);
    setLastResult(null);
    try {
      const result = await redeemMealTicket(activeDayId, code.trim());
      setLastResult(result);
      setManualCode("");
      await qc.invalidateQueries({ queryKey: ["event-meal-redemptions", activeDayId] });
      toast.success(`${result.attendeeName}: ${result.usedCount} of ${result.allowance} meals used`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Meal ticket could not be redeemed");
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <AdminShell>
      <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
        <Link to="/admin/events"><ArrowLeft className="mr-1 h-4 w-4" />Back to Events</Link>
      </Button>
      <AdminPageHeader
        title="Conference Meal Tickets"
        description={`${header?.title ?? "Event"} · Configure daily allowances and scan one-use meal credentials.`}
      />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-serif text-lg font-semibold">Daily allowances</h2>
            <div><Label htmlFor="meal-date">Event day</Label><Input id="meal-date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></div>
            <div><Label htmlFor="meal-label">Label</Label><Input id="meal-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Day 1 meals or Lunch" /></div>
            <div><Label htmlFor="meal-allowance">Tickets per attendee</Label><Input id="meal-allowance" type="number" min="1" max="10" value={allowance} onChange={(e) => setAllowance(e.target.value)} /></div>
            <Button className="w-full" disabled={saving} onClick={() => void addDay()}><Plus className="mr-2 h-4 w-4" />Add meal service</Button>
            <div className="space-y-2 border-t pt-4">
              {days.length === 0 && <p className="text-sm text-muted-foreground">No meal services configured.</p>}
              {days.map((day) => (
                <div key={day.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                  <div><div className="font-medium">{day.label}</div><div className="text-muted-foreground">{day.serviceDate} · {day.allowance} per attendee</div></div>
                  <Button size="sm" variant="ghost" onClick={async () => { await setMealDayActive(day.id, !day.isActive); await qc.invalidateQueries({ queryKey: ["event-meal-days", eventId] }); }}>{day.isActive ? "Disable" : "Enable"}</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <Label>Active meal service</Label>
              <Select value={activeDayId} onValueChange={(value) => { setActiveDayId(value); setLastResult(null); }}>
                <SelectTrigger><SelectValue placeholder="Select day or meal" /></SelectTrigger>
                <SelectContent>{days.filter((day) => day.isActive).map((day) => <SelectItem key={day.id} value={day.id}>{day.serviceDate} · {day.label} · {day.allowance} tickets</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {lastResult && (
              <div className={`rounded-2xl border-2 p-5 ${lastResult.remaining === 0 ? "border-amber-500 bg-amber-50" : "border-green-600 bg-green-50"}`}>
                <div className="text-xl font-bold text-foreground">{lastResult.attendeeName}</div>
                <div className="mt-1 text-sm text-muted-foreground">{lastResult.mealLabel}</div>
                <div className="mt-3 text-3xl font-black text-primary">{lastResult.usedCount} of {lastResult.allowance} used</div>
                <div className="mt-1 font-semibold">{lastResult.remaining} remaining</div>
              </div>
            )}

            <QrTicketScanner continuous disabled={redeeming || !activeDayId} onDetected={redeem} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="Enter attendee ticket code" className="font-mono" onKeyDown={(e) => { if (e.key === "Enter") void redeem(manualCode); }} />
              <Button disabled={redeeming || !activeDayId} onClick={() => void redeem(manualCode)}>{redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Utensils className="h-4 w-4" />}Redeem</Button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
              <span className="font-medium">Meals redeemed for selected service</span><Badge>{redemptions.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
