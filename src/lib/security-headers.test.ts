import { describe, expect, it } from "vitest";
import { withSecurityHeaders } from "./security-headers";

describe("production security headers", () => {
  it("adds baseline browser protections and HSTS on HTTPS", () => {
    const response = withSecurityHeaders(
      new Request("https://jesup.example.org/programs"),
      new Response("ok", { headers: { "cache-control": "public, max-age=60" } }),
    );

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toContain("geolocation=(self)");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("cache-control")).toBe("public, max-age=60");
  });

  it("does not send HSTS during local HTTP development", () => {
    const response = withSecurityHeaders(new Request("http://localhost:8080/"), new Response("ok"));
    expect(response.headers.has("strict-transport-security")).toBe(false);
  });
});
