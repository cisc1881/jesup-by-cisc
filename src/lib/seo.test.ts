import { describe, expect, it } from "vitest";
import { buildPageHead, JESUP_DEFAULT_SOCIAL_IMAGE, JESUP_SITE_URL } from "./seo";

function metaContent(head: ReturnType<typeof buildPageHead>, key: string) {
  return head.meta.find((item) => item.property === key || item.name === key)?.content;
}

describe("page discovery metadata", () => {
  it("uses an absolute 1200 by 630 default social preview", () => {
    const head = buildPageHead({ title: "Programs", path: "/programs" });
    expect(metaContent(head, "og:image")).toBe(
      new URL(JESUP_DEFAULT_SOCIAL_IMAGE, JESUP_SITE_URL).toString(),
    );
    expect(metaContent(head, "og:image:width")).toBe("1200");
    expect(metaContent(head, "og:image:height")).toBe("630");
    expect(metaContent(head, "twitter:card")).toBe("summary_large_image");
  });

  it("turns relative content images into absolute URLs", () => {
    const head = buildPageHead({
      title: "Example event",
      path: "/events/example",
      imageUrl: "/starter/community-extension.jpg",
    });
    expect(metaContent(head, "og:image")).toBe(
      new URL("/starter/community-extension.jpg", JESUP_SITE_URL).toString(),
    );
  });
});
