import { describe, expect, it } from "vitest";
import { RESUME_MAX_BYTES, validateResumeFile } from "./internship-application-form";

describe("validateResumeFile", () => {
  it.each(["resume.pdf", "resume.DOC", "resume.docx"])("accepts %s", (name) => {
    expect(validateResumeFile({ name, size: 1024 })).toBeNull();
  });

  it("rejects unsupported formats", () => {
    expect(validateResumeFile({ name: "resume.png", size: 1024 })).toMatch(/PDF or Word/);
  });

  it("rejects files larger than 10 MB", () => {
    expect(validateResumeFile({ name: "resume.pdf", size: RESUME_MAX_BYTES + 1 })).toMatch(/10 MB/);
  });
});
