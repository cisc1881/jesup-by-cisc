import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("notification permission gating", () => {
  it("calls Notification.requestPermission only inside enableNotifications", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/hooks/use-push-notifications.ts"),
      "utf8",
    );

    const requestMatches = [...source.matchAll(/Notification\.requestPermission/g)];
    expect(requestMatches.length).toBe(1);

    const enableIdx = source.indexOf("const enableNotifications");
    const requestIdx = source.indexOf("Notification.requestPermission");
    expect(enableIdx).toBeGreaterThan(-1);
    expect(requestIdx).toBeGreaterThan(enableIdx);

    expect(source.includes("useEffect(() => {\n    void refresh();\n  }, [refresh]);")).toBe(true);
    expect(source.slice(0, enableIdx).includes("Notification.requestPermission")).toBe(false);
  });

  it("does not request permission from weather CTA component", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/weather/weather-notification-cta.tsx"),
      "utf8",
    );
    expect(source.includes("requestPermission")).toBe(false);
  });
});
