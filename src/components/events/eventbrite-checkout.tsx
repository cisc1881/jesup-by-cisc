import { useEffect, useId, useState } from "react";
import { ExternalLink, Ticket } from "lucide-react";
import { AppButton } from "@/components/design-system";

declare global {
  interface Window {
    EBWidgets?: {
      createWidget: (options: Record<string, unknown>) => void;
    };
  }
}

const EVENTBRITE_WIDGET_SRC = "https://www.eventbrite.com/static/widgets/eb_widgets.js";

type EventbriteCheckoutProps = {
  eventId: string;
  eventUrl: string;
  priceLabel?: string | null;
};

export function EventbriteCheckout({ eventId, eventUrl, priceLabel }: EventbriteCheckoutProps) {
  const reactId = useId();
  const triggerId = `eventbrite-checkout-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initialize = () => {
      if (cancelled || !window.EBWidgets) return;
      window.EBWidgets.createWidget({
        widgetType: "checkout",
        eventId,
        modal: true,
        modalTriggerElementId: triggerId,
      });
      setWidgetReady(true);
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EVENTBRITE_WIDGET_SRC}"]`);
    if (window.EBWidgets) {
      initialize();
    } else if (existing) {
      existing.addEventListener("load", initialize, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = EVENTBRITE_WIDGET_SRC;
      script.async = true;
      script.addEventListener("load", initialize, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      existing?.removeEventListener("load", initialize);
    };
  }, [eventId, triggerId]);

  return (
    <div className="space-y-3">
      {priceLabel && <p className="text-lg font-black text-foreground">{priceLabel}</p>}
      <p className="text-sm leading-relaxed text-muted-foreground">
        Choose tickets and complete secure payment through Eventbrite without leaving this event page.
      </p>
      <AppButton id={triggerId} variant="primary" size="lg" shape="pill" className="w-full">
        <Ticket className="h-4 w-4" />
        Buy tickets
      </AppButton>
      {!widgetReady && (
        <AppButton variant="outline" size="sm" shape="pill" className="w-full" asChild>
          <a href={eventUrl} target="_blank" rel="noopener noreferrer">
            Open Eventbrite checkout <ExternalLink className="h-4 w-4" />
          </a>
        </AppButton>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Secure payment and ticket delivery powered by Eventbrite.
      </p>
    </div>
  );
}
