import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { AppButton, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/design-system";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { bucketCoordinates } from "@/lib/weather-notifications";
import { readStoredWeatherLocation } from "@/lib/weather/location-storage";
import { toast } from "sonner";
import { Bell, BellOff, TestTube2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/me/weather-alerts")({
  component: WeatherAlertsSettingsPage,
});

function WeatherAlertsSettingsPage() {
  const {
    user,
    permission,
    isSupported,
    swRegistered,
    busy,
    subscriptions,
    preferences,
    setPreferences,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    savePreferences,
  } = usePushNotifications();

  if (!user) {
    return (
      <PublicLayout>
        <PageHeader title="Weather alerts" description="Sign in to manage severe weather notifications." />
        <AppButton asChild><Link to="/auth" search={{ next: "/me/weather-alerts" }}>Sign in</Link></AppButton>
      </PublicLayout>
    );
  }

  const prefs = preferences ?? {
    enabled: false,
    alertsEnabled: true,
    watchesEnabled: true,
    warningsEnabled: true,
    emergenciesEnabled: true,
    dailyForecastEnabled: false,
    locationSource: null,
    countyName: null,
    stateCode: null,
    latitudeBucket: null,
    longitudeBucket: null,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  async function syncLocationFromBrowser() {
    const stored = readStoredWeatherLocation();
    if (!stored) {
      toast.message("Set a location on the Home weather center first.");
      return;
    }
    const buckets = bucketCoordinates(stored.lat, stored.lon);
    setPreferences({
      ...prefs,
      locationSource: stored.source,
      countyName: stored.county ?? null,
      stateCode: stored.state ?? null,
      ...buckets,
    });
  }

  async function handleSave() {
    await savePreferences(prefs);
    toast.success("Weather alert preferences saved.");
  }

  return (
    <PublicLayout>
      <PageHeader
        title="Weather alert preferences"
        description="Opt in to severe weather notifications for your selected county. All alerts are optional."
      />

      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <AppCard padding="md">
          <AppCardHeader>
            <AppCardTitle>Development test mode</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Server push delivery is not active yet. You can send a <strong className="text-foreground">local development test</strong> notification after granting browser permission. No live NWS alerts are sent.
            </p>
            <p>Permission status: <strong className="text-foreground">{permission}</strong> · Service worker: <strong className="text-foreground">{swRegistered ? "registered" : "not registered"}</strong></p>
          </AppCardContent>
        </AppCard>

        <AppCard padding="md">
          <AppCardHeader><AppCardTitle>Master controls</AppCardTitle></AppCardHeader>
          <AppCardContent className="space-y-4">
            <ToggleRow label="Enable severe weather alerts" checked={prefs.enabled} onCheckedChange={(enabled) => setPreferences({ ...prefs, enabled })} />
            <div className="flex flex-wrap gap-3">
              <AppButton className="min-h-11" onClick={() => void enableNotifications()} disabled={busy || !isSupported}>
                <Bell aria-hidden="true" /> Enable notifications
              </AppButton>
              <AppButton variant="outline" className="min-h-11" onClick={() => void disableNotifications()} disabled={busy}>
                <BellOff aria-hidden="true" /> Disable notifications
              </AppButton>
              <AppButton variant="outline" className="min-h-11" onClick={() => void sendTestNotification()} disabled={permission !== "granted"}>
                <TestTube2 aria-hidden="true" /> Send test notification
              </AppButton>
            </div>
            {!isSupported ? <p className="text-sm text-destructive">This browser does not support notifications.</p> : null}
            {permission === "denied" ? <p className="text-sm text-destructive">Permission denied. Update browser site settings to re-enable.</p> : null}
          </AppCardContent>
        </AppCard>

        <AppCard padding="md">
          <AppCardHeader><AppCardTitle>Alert types</AppCardTitle></AppCardHeader>
          <AppCardContent className="space-y-3">
            <ToggleRow label="Advisories" checked={prefs.alertsEnabled} onCheckedChange={(alertsEnabled) => setPreferences({ ...prefs, alertsEnabled })} />
            <ToggleRow label="Watches" checked={prefs.watchesEnabled} onCheckedChange={(watchesEnabled) => setPreferences({ ...prefs, watchesEnabled })} />
            <ToggleRow label="Warnings" checked={prefs.warningsEnabled} onCheckedChange={(warningsEnabled) => setPreferences({ ...prefs, warningsEnabled })} />
            <ToggleRow label="Emergencies" checked={prefs.emergenciesEnabled} onCheckedChange={(emergenciesEnabled) => setPreferences({ ...prefs, emergenciesEnabled })} />
            <ToggleRow label="Daily forecast (future)" checked={prefs.dailyForecastEnabled} onCheckedChange={(dailyForecastEnabled) => setPreferences({ ...prefs, dailyForecastEnabled })} />
          </AppCardContent>
        </AppCard>

        <AppCard padding="md">
          <AppCardHeader><AppCardTitle>Location</AppCardTitle></AppCardHeader>
          <AppCardContent className="space-y-3 text-sm">
            <p>County: <strong>{prefs.countyName ?? "Not set"}</strong> {prefs.stateCode ? `(${prefs.stateCode})` : ""}</p>
            <p>Coarse area bucket: {prefs.latitudeBucket != null ? `${prefs.latitudeBucket}, ${prefs.longitudeBucket}` : "Not set"}</p>
            <AppButton variant="outline" className="min-h-11" onClick={() => void syncLocationFromBrowser()}>Use Home weather location</AppButton>
          </AppCardContent>
        </AppCard>

        <AppCard padding="md">
          <AppCardHeader><AppCardTitle>Quiet hours</AppCardTitle></AppCardHeader>
          <AppCardContent className="space-y-4">
            <ToggleRow label="Enable quiet hours" checked={prefs.quietHoursEnabled} onCheckedChange={(quietHoursEnabled) => setPreferences({ ...prefs, quietHoursEnabled })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="quiet-start">Start</Label><Input id="quiet-start" type="time" value={prefs.quietHoursStart ?? ""} onChange={(e) => setPreferences({ ...prefs, quietHoursStart: e.target.value })} /></div>
              <div><Label htmlFor="quiet-end">End</Label><Input id="quiet-end" type="time" value={prefs.quietHoursEnd ?? ""} onChange={(e) => setPreferences({ ...prefs, quietHoursEnd: e.target.value })} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Timezone: {prefs.timezone}. Emergency alerts bypass quiet hours.</p>
          </AppCardContent>
        </AppCard>

        <AppCard padding="md">
          <AppCardHeader><AppCardTitle>Devices</AppCardTitle></AppCardHeader>
          <AppCardContent className="space-y-2 text-sm">
            {subscriptions.length === 0 ? <p className="text-muted-foreground">No active device subscriptions.</p> : null}
            {subscriptions.map((sub) => (
              <p key={sub.id}>{sub.deviceLabel ?? "Device"} — {sub.isActive ? "active" : "inactive"}</p>
            ))}
          </AppCardContent>
        </AppCard>

        <AppCard padding="md">
          <AppCardContent className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-foreground">Privacy:</strong> Notifications are opt-in. JESUP does not continuously track your location. Only coarse coordinate buckets and county/state are stored — never precise coordinates in our database.</p>
            <p>Browser permission is requested only when you tap Enable notifications.</p>
          </AppCardContent>
        </AppCard>

        <AppButton className="min-h-11" onClick={() => void handleSave()} disabled={busy}>Save preferences</AppButton>
      </div>
    </PublicLayout>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
