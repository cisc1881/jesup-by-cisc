import { describe, expect, it } from "vitest";
import { buildConversationMessages } from "./execute";

describe("Ask JESUP conversation assembly", () => {
  it("includes bounded prior turns before the current question", () => {
    const history = Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: ` turn   ${index} `,
    }));

    const messages = buildConversationMessages("  what about dates? ", history);
    expect(messages).toHaveLength(7);
    expect(messages[0].content).toBe("turn 2");
    expect(messages.at(-1)).toEqual({ role: "user", content: "what about dates?" });
  });

  it("drops empty history and caps content by role", () => {
    const messages = buildConversationMessages("next", [
      { role: "user", content: "   " },
      { role: "user", content: "u".repeat(300) },
      { role: "assistant", content: "a".repeat(2_100) },
    ]);

    expect(messages).toHaveLength(3);
    expect(messages[0].content).toHaveLength(240);
    expect(messages[1].content).toHaveLength(2_000);
  });
});
