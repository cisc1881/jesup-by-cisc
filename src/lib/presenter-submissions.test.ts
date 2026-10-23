import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRESENTER_MIME_TYPES,
  isOwnedPresenterPath,
  presenterFilePath,
  safeFileName,
  submissionWindowStatus,
  validatePresenterFile,
} from "./presenter-submissions";

const base = { enabled: true, opensAt: null, closesAt: null };

describe("submissionWindowStatus", () => {
  const now = new Date("2027-01-15T18:00:00Z");

  it("is disabled with no settings row (FC135 default until an admin configures it)", () => {
    expect(submissionWindowStatus(null, now)).toBe("disabled");
    expect(submissionWindowStatus(undefined, now)).toBe("disabled");
  });

  it("is disabled when the module is switched off even inside the window", () => {
    expect(submissionWindowStatus({ ...base, enabled: false }, now)).toBe("disabled");
  });

  it("is not-open before the opening time", () => {
    expect(
      submissionWindowStatus({ ...base, opensAt: "2027-01-16T00:00:00Z" }, now),
    ).toBe("not-open");
  });

  it("is open inside the window and with no times set", () => {
    expect(submissionWindowStatus(base, now)).toBe("open");
    expect(
      submissionWindowStatus(
        { ...base, opensAt: "2027-01-01T00:00:00Z", closesAt: "2027-02-01T00:00:00Z" },
        now,
      ),
    ).toBe("open");
  });

  it("is closed at or after the cutoff, blocking late create/replace", () => {
    expect(
      submissionWindowStatus({ ...base, closesAt: "2027-01-15T18:00:00Z" }, now),
    ).toBe("closed");
    expect(
      submissionWindowStatus({ ...base, closesAt: "2027-01-14T23:59:00Z" }, now),
    ).toBe("closed");
  });
});

describe("validatePresenterFile", () => {
  const settings = { allowedMimeTypes: DEFAULT_PRESENTER_MIME_TYPES, maxFileBytes: 25 * 1024 * 1024 };

  it("accepts an allowed type within the size limit", () => {
    expect(
      validatePresenterFile({ name: "talk.pdf", size: 1024, type: "application/pdf" }, settings),
    ).toBeNull();
  });

  it("rejects a disallowed type", () => {
    expect(
      validatePresenterFile({ name: "script.exe", size: 1024, type: "application/x-msdownload" }, settings),
    ).toMatch(/file type/i);
  });

  it("rejects files over the configured max size", () => {
    expect(
      validatePresenterFile(
        { name: "big.pdf", size: 26 * 1024 * 1024, type: "application/pdf" },
        settings,
      ),
    ).toMatch(/25 MB/);
  });

  it("rejects empty files", () => {
    expect(
      validatePresenterFile({ name: "empty.pdf", size: 0, type: "application/pdf" }, settings),
    ).toMatch(/empty/i);
  });
});

describe("presenterFilePath", () => {
  it("scopes paths to event and presenter and sanitizes the file name", () => {
    const path = presenterFilePath("event-1", "presenter-2", "my slides final!.pptx");
    expect(path.startsWith("event-1/presenter-2/")).toBe(true);
    expect(path).toContain("my_slides_final_.pptx");
    expect(safeFileName("???")).toBe("___");
  });
});
