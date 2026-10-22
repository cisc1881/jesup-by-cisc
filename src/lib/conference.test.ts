import { describe, expect, it } from "vitest";
import { FC135, conferenceDateRange, conferenceResourceLinks, eventDateLabel, eventLocalInput, eventLocalToUtc, visibleConferenceSections, safeEventUrl } from "./conference";
import type { EventDetail } from "./events";

const event = { startsAt: "2027-02-18T06:00:00Z", endsAt: "2027-02-20T06:00:00Z", metadata: { date_only: true, start_date: FC135.startDate, end_date: FC135.endDate, sections: {} }, sessions: [], speakers: [], sponsors: [], publications: [], podcasts: [], lat: null, lng: null, registrationOpen: false } as unknown as EventDetail;

describe("FC135 conference rules", () => {
  it("saves February 18–19 as exclusive midnight boundaries without service times", () => {
    expect(conferenceDateRange("2027-02-18", "2027-02-19", "America/Chicago")).toEqual({ startsAt: "2027-02-18T06:00:00.000Z", endsAt: "2027-02-20T06:00:00.000Z" });
    expect(() => conferenceDateRange("2027-02-19", "2027-02-18", "America/Chicago")).toThrow();
    expect(() => conferenceDateRange("2027-02-30", "2027-03-01", "America/Chicago")).toThrow();
  });
  it("keeps an enabled but empty catalog hidden", () => {
    const catalogEvent = { ...event, metadata: { sections: { tickets: true }, catalog_enabled: true } };
    expect(visibleConferenceSections(catalogEvent, 0).map(([id]) => id)).toEqual(["home"]);
    expect(visibleConferenceSections(catalogEvent, 1).map(([id]) => id)).toEqual(["home", "tickets"]);
    expect(visibleConferenceSections({ ...catalogEvent, metadata: { catalog_enabled: true } }, 1).map(([id]) => id)).toEqual(["home"]);
  });
  it("requires both enabled Resources and a named safe link", () => {
    const metadata = { sections: { resources: true }, resource_links: [{label:"Campus resource",url:"https://www.tuskegee.edu"},{label:"Unsafe",url:"javascript:alert(1)"},{label:"",url:"https://www.tuskegee.edu"}] };
    expect(conferenceResourceLinks(metadata)).toEqual([{label:"Campus resource",url:"https://www.tuskegee.edu/"}]);
    expect(visibleConferenceSections({...event,metadata}).map(([id]) => id)).toEqual(["home","resources"]);
    expect(visibleConferenceSections({...event,metadata:{...metadata,sections:{}}}).map(([id]) => id)).toEqual(["home"]);
  });
  it("uses the confirmed conference dates in Central time", () => {
    expect(eventLocalToUtc("2027-02-18T00:00", FC135.timezone)).toBe("2027-02-18T06:00:00.000Z");
    expect(eventLocalInput("2027-02-20T06:00:00Z", FC135.timezone)).toBe("2027-02-20T00:00");
    expect(eventDateLabel(event)).toBe("February 18–19, 2027");
  });
  it("retains confirmed campus and theme", () => {
    expect(FC135.title).toBe("135th Annual Farmers Conference");
    expect(FC135.timezone).toBe("America/Chicago");
    expect(FC135.startDate).toBe("2027-02-18");
    expect(FC135.endDate).toBe("2027-02-19");
    expect(FC135.location).toBe("Tuskegee University Historic Campus");
    expect(FC135.theme).toBe("A Legacy in the Soil, A Vision in the Seed");
  });
  it("keeps Tickets hidden when the configured URL is unsafe", () => {
    expect(visibleConferenceSections({ ...event, metadata: { sections: { tickets: true }, eventbrite_event_id: "123", eventbrite_event_url: "javascript:alert(1)" } }).map(([id]) => id)).toEqual(["home"]);
  });
  it("hides every unconfigured section even if its toggle is enabled", () => {
    const sections = Object.fromEntries(["schedule","speakers","tickets","sponsors","map","resources","community","my-event","wallet"].map(id => [id,true]));
    expect(visibleConferenceSections({ ...event, metadata: { sections } }).map(([id]) => id)).toEqual(["home"]);
  });
  it("requires admin enablement even when session data exists", () => {
    const withSession = { ...event, sessions: [{ id: "s", title: "Confirmed session" }] } as EventDetail;
    expect(visibleConferenceSections(withSession).map(([id]) => id)).toEqual(["home"]);
    expect(visibleConferenceSections({ ...withSession, metadata: { sections: { schedule: true } } }).map(([id]) => id)).toEqual(["home","schedule"]);
  });
  it("rejects unsafe registration and map links", () => {
    expect(safeEventUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeEventUrl("https://www.tuskegee.edu")).toBe("https://www.tuskegee.edu/");
  });
});