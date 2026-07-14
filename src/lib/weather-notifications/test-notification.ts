/** Development-only local notification — no server push, no fake NWS alerts. */

export async function sendDevelopmentTestNotification(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("Notifications are not supported in this browser.");
  }

  if (Notification.permission !== "granted") {
    throw new Error("Notification permission is required for test notifications.");
  }

  const registration = await navigator.serviceWorker?.getRegistration("/");
  const payload = {
    title: "Development test — JESUP Weather",
    body: "This is a local development test notification. No live NWS alert was sent.",
    tag: "jesup-weather-dev-test",
    data: { url: "/me/weather-alerts", test: true },
  };

  if (registration?.showNotification) {
    await registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: payload.data,
    });
    return;
  }

  new Notification(payload.title, {
    body: payload.body,
    tag: payload.tag,
    data: payload.data,
  });
}
