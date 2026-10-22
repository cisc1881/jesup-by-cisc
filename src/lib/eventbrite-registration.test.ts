import { describe, expect, it } from "vitest";
import { authorizedEventbriteRegistrationUrl } from "./eventbrite-registration";
import { visibleConferenceSections } from "./conference";
import type { EventDetail } from "./events";

const configured = {
  registrationStatus: "open",
  metadata: {
    registration_provider: "eventbrite",
    eventbrite_event_id: "2003462000776",
    eventbrite_event_url: "https://www.eventbrite.com/e/2003462000776?aff=oddtdtcreator",
    eventbrite_event_status: "published",
    eventbrite_registration_authorized: true,
  },
};
describe("Eventbrite public registration authorization", () => {
  it("never exposes the FC135 unpublished draft purchase URL", () => {
    expect(authorizedEventbriteRegistrationUrl({ ...configured, metadata: { ...configured.metadata, eventbrite_event_status: "draft" } })).toBeUndefined();
  });
  it("requires registration enablement even for an authorized published URL", () => {
    for (const registrationStatus of ["closed", "sold_out", "invite_only"]) {
      expect(authorizedEventbriteRegistrationUrl({ ...configured, registrationStatus })).toBeUndefined();
    }
  });
  it("requires explicit organizer authorization", () => {
    expect(authorizedEventbriteRegistrationUrl({ ...configured, metadata: { ...configured.metadata, eventbrite_registration_authorized: false } })).toBeUndefined();
    expect(authorizedEventbriteRegistrationUrl({ ...configured, metadata: { ...configured.metadata, eventbrite_event_status: undefined } })).toBeUndefined();
  });
  it("returns exactly the configured URL only after publication and authorization", () => {
    expect(authorizedEventbriteRegistrationUrl(configured)).toBe(configured.metadata.eventbrite_event_url);
  });
  it("requires Eventbrite provider and rejects unsafe or mismatched event URLs", () => {
    expect(authorizedEventbriteRegistrationUrl({ ...configured, metadata: { ...configured.metadata, registration_provider: "jesup" } })).toBeUndefined();
    for (const eventbrite_event_url of ["javascript:alert(1)", "https://eventbrite.com.evil.test/e/2003462000776", "https://www.eventbrite.com/manage/events/2003462000776", "https://www.eventbrite.com/e/123", "https://user:pass@eventbrite.com/e/2003462000776"]) {
      expect(authorizedEventbriteRegistrationUrl({ ...configured, metadata: { ...configured.metadata, eventbrite_event_url } })).toBeUndefined();
    }
  });
  it("does not expose conference Tickets solely because the draft URL exists", () => {
    const event = { ...configured, registrationOpen: false, sessions: [], speakers: [], sponsors: [], publications: [], podcasts: [], lat: null, lng: null, metadata: { ...configured.metadata, sections: { tickets: true } } } as unknown as EventDetail;
    expect(visibleConferenceSections({ ...event, metadata: { ...event.metadata, eventbrite_event_status: "draft" } }).map(([id]) => id)).toEqual(["home"]);
    expect(visibleConferenceSections(event).map(([id]) => id)).toEqual(["home", "tickets"]);
    expect(visibleConferenceSections({ ...event, registrationStatus: "closed" }).map(([id]) => id)).toEqual(["home"]);
  });
});