import { describe, expect, it } from "vitest";
import { isAuthReturn, isPasswordSetupReturn, needsEntryChoice, publicEntryDestination } from "./entry-session";

describe("session entry rules", () => {
  it("requires a choice on fresh anonymous entry", () => expect(needsEntryChoice({signedIn:false, guestChosen:false, authReturn:false})).toBe(true));
  it("keeps a repeated guest entry chosen", () => expect(needsEntryChoice({signedIn:false, guestChosen:true, authReturn:false})).toBe(false));
  it("bypasses choice for authenticated admins and other users", () => expect(needsEntryChoice({signedIn:true, guestChosen:false, authReturn:false})).toBe(false));
  it("preserves a public deep link including query and anchor", () => expect(publicEntryDestination("/events/fc135?tab=schedule#agenda")).toBe("/events/fc135?tab=schedule#agenda"));
  it("never continues a guest to a protected page", () => {
    expect(publicEntryDestination("/admin")).toBe("/");
    expect(publicEntryDestination("/events/fc135/staff")).toBe("/");
  });
  it("rejects external and encoded unsafe destinations", () => {
    for (const input of ["//example.com", "/%2f%2fexample.com", "/\\example.com", "https://example.com"]) expect(publicEntryDestination(input)).toBe("/");
  });
  it("bypasses password-reset links", () => expect(isAuthReturn("/auth", "?mode=reset", "")).toBe(true));
  it("bypasses one-time invite and OAuth returns", () => {
    expect(isAuthReturn("/auth", "?token_hash=one-time&type=invite", "")).toBe(true);
    expect(isAuthReturn("/", "?code=one-time", "")).toBe(true);
    expect(isAuthReturn("/auth", "", "#access_token=test&type=recovery")).toBe(true);
  });
  it("does not mistake a normal auth visit for a callback", () => expect(isAuthReturn("/auth", "?next=%2Fevents%2Ffc135", "")).toBe(false));
  it("keeps invite and recovery returns in password setup instead of redirecting", () => {
    expect(isPasswordSetupReturn("?type=invite", "")).toBe(true);
    expect(isPasswordSetupReturn("", "#type=recovery")).toBe(true);
    expect(isPasswordSetupReturn("?code=one-time", "")).toBe(false);
  });
});