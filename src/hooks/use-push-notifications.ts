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
  urlBase64ToUint8Array,
  type PushPermissionState,
  type WeatherNotificationPreferencesInput,
} from "@/lib/weather-notifications";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

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
  const [subscriptions, setSubscriptions] = useState<Awaited<ReturnType<typeof listPushSubscriptions>>>([]);
  const [preferences, setPreferences] = useState<WeatherNotificationPreferencesInput | null>(null);

  const isSupported = permission !== "unsupported" && typeof window !== "undefined" && "serviceWorker" in navigator;

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

      if (registration && VAPID_PUBLIC_KEY) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const json = subscription.toJSON();
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await subscribeDevice(user.id, {
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            userAgent: navigator.userAgent,
            deviceLabel: "This device",
          });
        }
      }

      await refresh();
      toast.success(
        VAPID_PUBLIC_KEY
          ? "Weather alerts enabled on this device."
          : "Preferences saved. Server push will activate after VAPID setup (development test mode available).",
      );
    } finally {
      setBusy(false);
    }
  }, [user, isSupported, preferences, refresh]);

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
    toast.success("Development test notification sent locally.");
  }, []);

  const status = useMemo(
    () =>
      resolvePushNotificationStatus({
        user,
        isSupported,
        permission,
        preferences,
      }),
    [user, isSupported, permission, preferences],
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
    refresh,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
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
