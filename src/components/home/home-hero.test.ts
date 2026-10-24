// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HomeHeroSlide } from "@/lib/home";
import { HomeHero } from "./home-hero";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => createElement("a", { href: "/about" }, children),
}));
vi.mock("@/components/design-system", () => ({
  AppButton: ({ children, asChild, variant, size, shape, ...props }: Record<string, unknown>) =>
    asChild ? children : createElement("button", props, children as React.ReactNode),
}));

const slides = ["About JESUP", "Programs", "Publications"].map((title, index) => ({
  id: String(index), title, subtitle: title, imageAlt: title, linkTo: "/about", linkLabel: "Read more",
})) as HomeHeroSlide[];

describe("HomeHero automatic rotation", () => {
  let root: Root;
  let container: HTMLDivElement;
  let motion: EventTarget & { matches: boolean };
  let pageHidden: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    pageHidden = false;
    motion = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal("matchMedia", vi.fn(() => motion));
    vi.spyOn(document, "hidden", "get").mockImplementation(() => pageHidden);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const render = (items = slides) => act(() => root.render(createElement(HomeHero, { slides: items })));
  const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
  const title = () => container.querySelector("h1")?.textContent;
  const button = (label: string) => {
    const element = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (!element) throw new Error(`Missing button: ${label}`);
    return element;
  };
  const pointer = (name: string, pointerType = "mouse") => act(() => {
    const section = container.querySelector("section");
    section?.dispatchEvent(new PointerEvent(name, { bubbles: true, pointerType }));
  });

  it("waits seven seconds, rotates all slides and wraps without auto-announcements", () => {
    render();
    tick(6999);
    expect(title()).toBe("About JESUP");
    tick(1);
    expect(title()).toBe("Programs");
    tick(7000);
    expect(title()).toBe("Publications");
    tick(7000);
    expect(title()).toBe("About JESUP");
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("");
  });

  it("resets after manual arrows and selecting the already-active tab", () => {
    render();
    tick(6000);
    act(() => button("Next featured item").click());
    expect(title()).toBe("Programs");
    tick(6000);
    expect(title()).toBe("Programs");
    act(() => button("Show Programs").click());
    tick(6999);
    expect(title()).toBe("Programs");
    tick(1);
    expect(title()).toBe("Publications");
    act(() => button("Next featured item").click());
    expect(title()).toBe("About JESUP");
    act(() => button("Previous featured item").click());
    expect(title()).toBe("Publications");
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("Publications, slide 3 of 3");
  });

  it("pauses on pointer hover and resumes with a full interval after leave", () => {
    render();
    tick(6000);
    pointer("pointerover");
    tick(20000);
    expect(title()).toBe("About JESUP");
    pointer("pointerout");
    tick(6999);
    expect(title()).toBe("About JESUP");
    tick(1);
    expect(title()).toBe("Programs");
  });

  it("does not leave touch users stuck in a hover pause", () => {
    render();
    pointer("pointerover", "touch");
    tick(7000);
    expect(title()).toBe("Programs");
  });

  it("pauses while focus moves between controls and until focus leaves", () => {
    render();
    act(() => button("Next featured item").focus());
    tick(14000);
    expect(title()).toBe("About JESUP");
    act(() => button("Previous featured item").focus());
    tick(14000);
    expect(title()).toBe("About JESUP");
    act(() => button("Previous featured item").blur());
    tick(7000);
    expect(title()).toBe("Programs");
  });

  it("pauses while hidden and restarts only when all pause reasons clear", () => {
    render();
    act(() => { pageHidden = true; document.dispatchEvent(new Event("visibilitychange")); });
    tick(21000);
    expect(title()).toBe("About JESUP");
    pointer("pointerover");
    act(() => { pageHidden = false; document.dispatchEvent(new Event("visibilitychange")); });
    tick(7000);
    expect(title()).toBe("About JESUP");
    pointer("pointerout");
    tick(7000);
    expect(title()).toBe("Programs");
  });

  it("respects initial and changing reduced motion while preserving manual navigation", () => {
    motion.matches = true;
    render();
    tick(21000);
    expect(title()).toBe("About JESUP");
    act(() => button("Next featured item").click());
    expect(title()).toBe("Programs");
    act(() => { motion.matches = false; motion.dispatchEvent(new Event("change")); });
    tick(7000);
    expect(title()).toBe("Publications");
    act(() => { motion.matches = true; motion.dispatchEvent(new Event("change")); });
    tick(14000);
    expect(title()).toBe("Publications");
  });

  it.each([0, 1])("does not schedule rotation for %i slides", (count) => {
    render(slides.slice(0, count));
    expect(vi.getTimerCount()).toBe(0);
    tick(21000);
    expect(title()).toBe(count ? "About JESUP" : "JESUP");
  });

  it("cleans up timers and preference/visibility listeners on unmount", () => {
    const preferenceCleanup = vi.spyOn(motion, "removeEventListener");
    const visibilityCleanup = vi.spyOn(document, "removeEventListener");
    render();
    expect(vi.getTimerCount()).toBe(1);
    act(() => root.render(null));
    expect(vi.getTimerCount()).toBe(0);
    expect(preferenceCleanup).toHaveBeenCalledWith("change", expect.any(Function));
    expect(visibilityCleanup).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});