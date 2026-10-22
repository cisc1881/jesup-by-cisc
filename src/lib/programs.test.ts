import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = { select: vi.fn(), order: vi.fn(), eq: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(), then: vi.fn() };
  return { query, from: vi.fn(() => query) };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
import { fetchPrograms, fetchProgramBySlug } from "./programs";

describe("public program visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const method of [mocks.query.select, mocks.query.order, mocks.query.eq, mocks.query.limit]) method.mockReturnValue(mocks.query);
    mocks.query.then.mockImplementation((resolve) => Promise.resolve({ data: [], error: null }).then(resolve));
    mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("reads active programs in configured menu order", async () => {
    expect(await fetchPrograms()).toEqual([]);
    expect(mocks.query.eq).toHaveBeenCalledWith("is_active", true);
    expect(mocks.query.order).toHaveBeenNthCalledWith(1, "sort_order", { ascending: true });
  });

  it("does not expose an inactive program through its detail URL", async () => {
    expect(await fetchProgramBySlug("value-addition-technology")).toBeNull();
    expect(mocks.query.eq).toHaveBeenCalledWith("slug", "value-addition-technology");
    expect(mocks.query.eq).toHaveBeenCalledWith("is_active", true);
  });
});