import { describe, expect, it, vi } from "vitest";
import { normalizeQuestion, retrieveJESUPContext } from "./rag";

describe("JESUP RAG context", () => {
  it("normalizes and bounds user questions", () => {
    expect(normalizeQuestion("  find   a market  ")).toBe("find a market");
    expect(normalizeQuestion("x".repeat(300))).toHaveLength(240);
  });

  it("formats search results as grounded, linked context", async () => {
    const search = vi.fn().mockResolvedValue([
      {
        id: "market-1",
        entityType: "market",
        title: "Macon County Market",
        description: "Fresh produce every Saturday",
        href: "/markets/$id",
        hrefParams: { id: "macon-county" },
        imageUrl: null,
        score: 80,
      },
    ]);

    const context = await retrieveJESUPContext(" local markets ", search);
    expect(search).toHaveBeenCalledWith("local markets", 8);
    expect(context.sources[0].href).toBe("/markets/macon-county");
    expect(context.promptContext).toContain("Fresh produce every Saturday");
    expect(context.promptContext).toContain("JESUP link: /markets/macon-county");
  });

  it("does not search for unusably short questions", async () => {
    const search = vi.fn();
    const context = await retrieveJESUPContext("a", search);
    expect(search).not.toHaveBeenCalled();
    expect(context.sources).toEqual([]);
  });
});
