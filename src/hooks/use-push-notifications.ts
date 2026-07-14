import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  defaultWeatherNotificationPreferences,
  getWeatherNotificationPreferences,
  listPushSubscriptions,
  registerWeatherServiceWorker,
  resolvePushNotificationStatus,
  saveWeatherNotificationPreferences,
  sendDevelopmentTestNotification,
  subscribeDevice,
  unsubscribeDevice,
  type PushPermissionState,
  type WeatherNotificationPreferencesInput,
} from "@/lib/weather-notifications";
import {
  formatVapidSetupError,
  sendServerPushTestServerFn,
} from "@/lib/weather-notifications/delivery-server-fn";
import { isClientVapidConfigured } from "@/lib/weather-notifications/vapid-config";
import {
  normalizeBrowserPushSubscription,
  urlBase64ToUint8Array,
} from "@/lib/weather-notifications/subscription-normalize";
import { toast } from "sonner";

function getPermissionState(): PushPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "default";
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>(getPermissionState);
  const [swRegistered, setSwRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [subscriptions, setSubscriptions] = useState<
    Awaited<ReturnType<typeof listPushSubscriptions>>
  >([]);
  const [preferences, setPreferences] = useState<WeatherNotificationPreferencesInput | null>(null);
  const [subscriptionAttemptFailed, setSubscriptionAttemptFailed] = useState(false);

  const vapidConfigured = isClientVapidConfigured();
  const isSupported =
    permission !== "unsupported" && typeof window !== "undefined" && "serviceWorker" in navigator;

  const refresh = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setSubscriptions([]);
      return;
    }

    const [prefs, subs] = await Promise.all([
      getWeatherNotificationPreferences(user.id),
      listPushSubscriptions(user.id),
    ]);

    setPreferences(
      prefs
        ? {
            enabled: prefs.enabled,
            alertsEnabled: prefs.alertsEnabled,
            watchesEnabled: prefs.watchesEnabled,
            warningsEnabled: prefs.warningsEnabled,
            emergenciesEnabled: prefs.emergenciesEnabled,
            dailyForecastEnabled: prefs.dailyForecastEnabled,
            locationSource: prefs.locationSource,
            countyName: prefs.countyName,
            stateCode: prefs.stateCode,
            latitudeBucket: prefs.latitudeBucket,
            longitudeBucket: prefs.longitudeBucket,
            quietHoursEnabled: prefs.quietHoursEnabled,
            quietHoursStart: prefs.quietHoursStart,
            quietHoursEnd: prefs.quietHoursEnd,
            timezone: prefs.timezone,
          }
        : defaultWeatherNotificationPreferences(user.id),
    );
    setSubscriptions(subs);
    setPermission(getPermissionState());
    const reg = await navigator.serviceWorker?.getRegistration("/");
    setSwRegistered(Boolean(reg));
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enableNotifications = useCallback(async () => {
    if (!user) throw new Error("Sign in required.");
    if (!isSupported) throw new Error("Push notifications are not supported in this browser.");

    setBusy(true);
    setSubscriptionAttemptFailed(false);
    try {
      const registration = await registerWeatherServiceWorker();
      setSwRegistered(Boolean(registration));

      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);
      if (result !== "granted") {
        throw new Error("Notification permission was denied.");
      }

      const nextPrefs = {
        ...(preferences ?? defaultWeatherNotificationPreferences(user.id)),
        enabled: true,
      };
      await saveWeatherNotificationPreferences(user.id, nextPrefs);
      setPreferences(nextPrefs);

      if (!vapidConfigured) {
        toast.message(
          "VAPID public key is not configured. Add VITE_VAPID_PUBLIC_KEY to enable server push.",
        );
        await refresh();
        return;
      }

      if (registration) {
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const normalized = normalizeBrowserPushSubscription(subscription, {
          userAgent: navigator.userAgent,
          deviceLabel: "This device",
        });
        if (!normalized) {
          setSubscriptionAttemptFailed(true);
          throw new Error("Could not normalize push subscription.");
        }
        await subscribeDevice(user.id, normalized);
      }

      await refresh();
      toast.success("Weather alerts enabled on this device.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("normalize")) {
        setSubscriptionAttemptFailed(true);
      }
      throw error;
    } finally {
      setBusy(false);
    }
  }, [user, isSupported, preferences, refresh, vapidConfigured]);

  const disableNotifications = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      const nextPrefs = {
        ...(preferences ?? defaultWeatherNotificationPreferences(user.id)),
        enabled: false,
      };
      await saveWeatherNotificationPreferences(user.id, nextPrefs);
      setPreferences(nextPrefs);

      for (const sub of subscriptions) {
        await unsubscribeDevice(user.id, sub.id);
      }

      await refresh();
      toast.success("Weather alerts disabled.");
    } finally {
      setBusy(false);
    }
  }, [user, preferences, subscriptions, refresh]);

  const sendTestNotification = useCallback(async () => {
    await sendDevelopmentTestNotification();
    toast.success("Local development test notification sent.");
  }, []);

  const sendServerPushTest = useCallback(async () => {
    if (!import.meta.env.DEV) {
      toast.error("Server push test is development-only.");
      return;
    }
    try {
      const result = await sendServerPushTestServerFn();
      if (result.sent > 0) {
        toast.success(`Development server push sent to ${result.sent} device(s).`);
      } else {
        toast.error("Server push test failed for all devices.");
      }
    } catch (error) {
      toast.error(formatVapidSetupError(error));
    }
  }, []);

  const activeSubscriptionCount = subscriptions.filter((sub) => sub.isActive).length;

  const status = useMemo(
    () =>
      resolvePushNotificationStatus({
        user,
        isSupported,
        permission,
        preferences,
        activeSubscriptionCount,
        vapidConfigured,
        subscriptionAttemptFailed,
      }),
    [
      user,
      isSupported,
      permission,
      preferences,
      activeSubscriptionCount,
      vapidConfigured,
      subscriptionAttemptFailed,
    ],
  );

  return {
    user,
    permission,
    isSupported,
    swRegistered,
    busy,
    subscriptions,
    preferences,
    setPreferences,
    status,
    vapidConfigured,
    refresh,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    sendServerPushTest,
    savePreferences: async (input: WeatherNotificationPreferencesInput) => {
      if (!user) return;
      const saved = await saveWeatherNotificationPreferences(user.id, input);
      setPreferences({
        enabled: saved.enabled,
        alertsEnabled: saved.alertsEnabled,
        watchesEnabled: saved.watchesEnabled,
        warningsEnabled: saved.warningsEnabled,
        emergenciesEnabled: saved.emergenciesEnabled,
        dailyForecastEnabled: saved.dailyForecastEnabled,
        locationSource: saved.locationSource,
        countyName: saved.countyName,
        stateCode: saved.stateCode,
        latitudeBucket: saved.latitudeBucket,
        longitudeBucket: saved.longitudeBucket,
        quietHoursEnabled: saved.quietHoursEnabled,
        quietHoursStart: saved.quietHoursStart,
        quietHoursEnd: saved.quietHoursEnd,
        timezone: saved.timezone,
      });
    },
  };
}
