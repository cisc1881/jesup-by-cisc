import { describe, expect, it } from "vitest";
import { getDraftAgendaNotice } from "./event-agenda-status";

describe("getDraftAgendaNotice", () => {
  it("treats the 2027 provisional agenda as planning rather than confirmed", () => {
    expect(getDraftAgendaNotice({ agenda_status: "provisional" })).not.toBeNull();
  });
  it("returns the organizer notice for placeholder agendas", () => {
    expect(
      getDraftAgendaNotice({
        agenda_status: "draft_placeholder",
        agenda_notice: "Draft schedule. Final details are pending.",
      }),
    ).toBe("Draft schedule. Final details are pending.");
  });

  it("uses a safe fallback when a draft has no custom notice", () => {
    expect(getDraftAgendaNotice({ agenda_status: "draft_placeholder" })).toContain(
      "preliminary agenda",
    );
  });

  it("does not label confirmed agendas", () => {
    expect(getDraftAgendaNotice({ agenda_status: "confirmed" })).toBeNull();
    expect(getDraftAgendaNotice({})).toBeNull();
  });
});
