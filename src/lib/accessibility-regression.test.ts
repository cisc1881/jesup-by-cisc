import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("core accessibility landmarks", () => {
  it("keeps public and admin main content keyboard focusable", () => {
    const publicLayout = read("src/components/public-layout.tsx");
    const adminLayout = read("src/modules/admin/components/command-center-layout.tsx");

    expect(publicLayout).toContain('id="main-content" tabIndex={-1}');
    expect(adminLayout).toContain("<SkipLink />");
    expect(adminLayout).toContain('id="main-content"');
    expect(adminLayout).toContain("tabIndex={-1}");
    expect(adminLayout).toContain('className="hidden sm:inline-flex"');
  });

  it("keeps compact navigation and event fields explicitly labelled", () => {
    const publicNav = read("src/components/public-nav.tsx");
    const registration = read("src/components/events/event-registration-panel.tsx");

    expect(publicNav).toContain('aria-label="Open account menu"');
    expect(registration).toContain("htmlFor={`event-${event.id}-invite-code`}");
    expect(registration).toContain("htmlFor={`event-${event.id}-registration-notes`}");
  });
});
