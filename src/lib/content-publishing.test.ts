import { describe, expect, it } from "vitest";
import {
  publishedAtValue,
  publishingWriteError,
  validateContentIdentity,
  validateEventSchedule,
  validateNewsPublication,
} from "./content-publishing";

describe("content publishing safeguards", () => {
  it("requires a title and a clean URL slug", () => {
    expect(() => validateContentIdentity("Program", "", "program")).toThrow("Program name is required");
    expect(() => validateContentIdentity("Program", "Program", "Bad Slug")).toThrow("lowercase letters");
    expect(() => validateContentIdentity("Program", "Program", "good-program-2")).not.toThrow();
  });

  it("rejects an event that ends before it starts", () => {
    expect(() => validateEventSchedule("2027-04-16T09:00", "2027-04-15T17:00")).toThrow("after its start");
    expect(() => validateEventSchedule("2027-04-15T09:00", "2027-04-16T17:00")).not.toThrow();
  });

  it("requires content before publishing news", () => {
    expect(() => validateNewsPublication(true, "", "")).toThrow("summary or article content");
    expect(() => validateNewsPublication(false, "", "")).not.toThrow();
  });

  it("automatically dates newly published content", () => {
    expect(publishedAtValue(false, "")).toBeNull();
    expect(publishedAtValue(true, "")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("turns duplicate slugs into an actionable message", () => {
    expect(publishingWriteError(new Error("duplicate key value violates unique constraint"), "Market").message)
      .toBe("A market with this URL slug already exists");
  });
});
