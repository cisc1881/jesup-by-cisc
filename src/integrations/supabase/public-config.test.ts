import { describe, expect, it } from "vitest";
import { resolvePublicConnection } from "./public-config";

const RECOVERED = "https://trffktqewlrzziowmspd.supabase.co";

describe("resolvePublicConnection", () => {
  it("falls back to the recovered project when hosted settings are missing", () => {
    expect(resolvePublicConnection(undefined, undefined).url).toBe(RECOVERED);
  });

  it("never connects to the lost project", () => {
    expect(resolvePublicConnection("https://bgpagczihcnondqttjnq.supabase.co", "k").url).toBe(RECOVERED);
  });

  it("keeps managed settings when they are present", () => {
    expect(resolvePublicConnection("https://other.supabase.co", "k")).toEqual({ url: "https://other.supabase.co", key: "k" });
  });
});
