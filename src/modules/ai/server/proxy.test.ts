import { describe, expect, it } from "vitest";
import { extractSseText } from "./proxy";

function inputStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

async function readText(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) return output;
    output += decoder.decode(value, { stream: true });
  }
}

describe("extractSseText", () => {
  it("extracts selected deltas across network chunk boundaries", async () => {
    const stream = extractSseText(
      inputStream([
        'data: {"type":"delta","text":"Hel',
        'lo"}\r',
        '\n\r\ndata: {"type":"delta","text":" world"}\r\n\r\n',
      ]),
      (event) => (event.type === "delta" ? String(event.text) : ""),
    );

    await expect(readText(stream)).resolves.toBe("Hello world");
  });

  it("ignores malformed, irrelevant, and terminal events", async () => {
    const stream = extractSseText(
      inputStream([
        "data: nope\n\n",
        'data: {"type":"ping"}\n\n',
        'data: {"type":"delta","text":"answer"}\n\n',
        "data: [DONE]\n\n",
      ]),
      (event) => (event.type === "delta" ? String(event.text) : ""),
    );

    await expect(readText(stream)).resolves.toBe("answer");
  });
});
