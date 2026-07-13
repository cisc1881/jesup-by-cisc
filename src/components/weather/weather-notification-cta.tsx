import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { AppBadge, AppButton, AppCard, AppCardContent } from "@/components/design-system";
import { Bell, BellOff, ShieldAlert } from "lucide-react";

const STATUS_COPY = {
  "signed-out": {
    label: "Sign in required",
    description: "Create an account or sign in to enable opt-in severe weather alerts.",
    action: "Sign in to enable alerts",
  },
  "not-subscribed": {
    label: "Not subscribed",
    description: "Opt in to receive severe weather watches, warnings, and emergencies for your county.",
    action: "Enable severe weather alerts",
  },
  subscribed: {
    label: "Subscribed",
    description: "You have opted in to severe weather notifications. Manage types and quiet hours in settings.",
    action: "Manage alert settings",
  },
  "permission-denied": {
    label: "Permission denied",
    description: "Browser notification permission was denied. Update site settings to enable alerts.",
    action: "Open alert settings",
  },
  unsupported: {
    label: "Unsupported browser",
    description: "This browser does not support push notifications.",
    action: "Learn more",
  },
} as const;

export function WeatherNotificationCta() {
  const { user } = useAuth();
  const { status } = usePushNotifications();
  const copy = STATUS_COPY[status];

  return (
    <AppCard padding="md" className="mb-4 border-primary/20 bg-primary/5">
      <AppCardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
            <p className="font-semibold text-foreground">Severe weather alerts</p>
            <AppBadge variant="secondary">{copy.label}</AppBadge>
          </div>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
          <p className="text-xs text-muted-foreground">Opt-in only. Permission is requested when you choose Enable — never automatically on page load.</p>
        </div>
        <div className="shrink-0">
          {user ? (
            <AppButton asChild className="min-h-11">
              <Link to="/me/weather-alerts">
                {status === "subscribed" ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}
                {copy.action}
              </Link>
            </AppButton>
          ) : (
            <AppButton asChild className="min-h-11">
              <Link to="/auth" search={{ next: "/me/weather-alerts" }}>
                {copy.action}
              </Link>
            </AppButton>
          )}
        </div>
      </AppCardContent>
    </AppCard>
  );
}
