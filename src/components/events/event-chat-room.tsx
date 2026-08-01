import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function EventChatRoom({ eventId, registered }: { eventId: string; registered: boolean }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const queryKey = ["event-chat", eventId];
  const { data: messages = [] } = useQuery({
    queryKey,
    enabled: registered,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_event_chat", { p_event_id: eventId });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: registered ? 15_000 : false,
  });
  const post = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("post_event_chat", {
        p_event_id: eventId,
        p_message: message,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <section
      id="event-chat"
      className="scroll-mt-24 rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
    >
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 institution-accent-text" />
        <h2 className="text-xl font-black text-foreground">Attendee chat</h2>
      </div>
      {!registered ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Register for this event to join the attendee conversation.
        </p>
      ) : (
        <>
          <div
            className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-muted/40 p-3"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Start the event conversation.
              </p>
            )}
            {messages.map((entry) => (
              <article key={entry.id} className="rounded-2xl bg-card p-3 shadow-sm">
                <div className="text-xs font-bold institution-accent-text">{entry.author_name}</div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{entry.message}</p>
              </article>
            ))}
          </div>
          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (message.trim()) post.mutate();
            }}
          >
            <Textarea
              id="event-chat-message"
              name="event_chat_message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Message registered attendees…"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || post.isPending}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {post.isError && (
            <p className="mt-2 text-sm text-destructive">
              Message could not be sent. Please try again.
            </p>
          )}
        </>
      )}
    </section>
  );
}
