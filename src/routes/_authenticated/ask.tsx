import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, LoaderCircle, Send, Sparkles } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askJESUPServerFn } from "@/modules/ai/ask-server-fn";

export const Route = createFileRoute("/_authenticated/ask")({ component: AskJESUPPage });

type Source = Awaited<ReturnType<typeof askJESUPServerFn>>["sources"][number];
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const SUGGESTED_QUESTIONS = [
  "What programs are available?",
  "Find a farmers market near me",
  "What upcoming events can I attend?",
  "Show me publications for farmers",
] as const;

function AskJESUPPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendQuestion(value: string) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length < 2 || isSending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: normalized,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError(null);
    setIsSending(true);

    try {
      const history = messages.slice(-6).map((message) => ({
        role: message.role,
        content: message.content.slice(0, message.role === "user" ? 240 : 2_000),
      }));
      const result = await askJESUPServerFn({ data: { question: normalized, history } });
      const assistantId = crypto.randomUUID();
      setMessages((current) => [
        ...current,
        { id: assistantId, role: "assistant", content: "", sources: result.sources },
      ]);
      const reader = result.stream.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        const text = decoder.decode(chunk, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: `${message.content}${text}` }
              : message,
          ),
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ask JESUP could not answer right now.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="CISC knowledge assistant"
        title="Ask JESUP"
        description="Find programs, events, markets, publications, and other resources from JESUP content."
      />

      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        {messages.length === 0 && (
          <Card className="border-primary/15 bg-primary/[0.03]">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold">How can I help?</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Try one of these questions or write your own. Answers are grounded in published
                    JESUP information.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    className="h-auto min-h-11 justify-start whitespace-normal py-3 text-left"
                    onClick={() => void sendQuestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <section className="space-y-4" aria-label="Conversation" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-2xl p-4 sm:p-5 ${
                message.role === "user"
                  ? "ml-auto max-w-2xl bg-primary text-primary-foreground"
                  : "mr-auto max-w-3xl border bg-card shadow-sm"
              }`}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                {message.role === "user" ? "You" : "JESUP"}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7 sm:text-base">
                {message.content}
              </p>
              {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    JESUP sources
                  </h3>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {message.sources.map((source) => (
                      <li key={`${message.id}-${source.entityType}-${source.id}`}>
                        <a
                          href={source.href}
                          className="flex min-h-11 items-start justify-between gap-3 rounded-lg border p-3 text-sm transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span>
                            <span className="block font-medium text-foreground">
                              {source.title}
                            </span>
                            <span className="capitalize text-muted-foreground">
                              {source.entityType}
                            </span>
                          </span>
                          <ArrowUpRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              JESUP is finding relevant information…
            </div>
          )}
        </section>

        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
            role="alert"
          >
            <p className="font-medium text-destructive">JESUP couldn’t answer that question.</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-20 space-y-2 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur md:bottom-4"
        >
          <label htmlFor="ask-jesup-question" className="sr-only">
            Ask JESUP a question
          </label>
          <div className="flex items-end gap-2">
            <Textarea
              id="ask-jesup-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value.slice(0, 240))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask about JESUP programs, events, markets, or resources…"
              rows={2}
              maxLength={240}
              disabled={isSending}
              aria-describedby="ask-jesup-help"
              className="max-h-40 min-h-14 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full"
              disabled={isSending || question.trim().length < 2}
              aria-label="Send question"
            >
              {isSending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Send aria-hidden="true" />
              )}
            </Button>
          </div>
          <div
            id="ask-jesup-help"
            className="flex justify-between gap-3 px-1 text-xs text-muted-foreground"
          >
            <span>Enter to send · Shift+Enter for a new line</span>
            <span>{question.length}/240</span>
          </div>
        </form>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          JESUP can make mistakes. Verify important details with CISC staff. Do not use Ask JESUP
          for medical, legal, financial, or emergency advice.
        </p>
      </div>
    </PublicLayout>
  );
}
