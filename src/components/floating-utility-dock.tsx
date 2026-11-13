import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Accessibility, MessageCircle, Minus, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Panel = "ask" | "accessibility" | null;
type Preferences = { textScale: number; highContrast: boolean; reduceMotion: boolean };

const DEFAULT_PREFERENCES: Preferences = {
  textScale: 100,
  highContrast: false,
  reduceMotion: false,
};
const STORAGE_KEY = "jesup-accessibility-preferences";
const DOCK_QUESTIONS = [
  "What events are coming up?",
  "Where can I find my event pass?",
  "Find publications for farmers",
] as const;

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.style.setProperty("--user-text-scale", `${preferences.textScale / 100}`);
  root.dataset.highContrast = String(preferences.highContrast);
  root.dataset.reduceMotion = String(preferences.reduceMotion);
}

export function FloatingUtilityDock() {
  const [panel, setPanel] = useState<Panel>(null);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const next = stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
      setPreferences(next);
      applyPreferences(next);
    } catch {
      applyPreferences(DEFAULT_PREFERENCES);
    }
  }, []);

  function updatePreferences(next: Preferences) {
    setPreferences(next);
    applyPreferences(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <aside
      className="fixed bottom-20 right-3 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6"
      aria-label="JESUP assistance tools"
    >
      {panel === "ask" ? (
        <div
          className="mb-1 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border bg-card p-4 shadow-2xl"
          role="dialog"
          aria-labelledby="ask-widget-title"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 id="ask-widget-title" className="font-bold institution-accent-text">
                  Ask JESUP
                </h2>
                <p className="text-xs text-muted-foreground">Your CISC knowledge assistant</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setPanel(null)}
              aria-label="Close Ask JESUP"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Find programs, events, markets, publications, and application information.
          </p>
          <div className="mt-4 space-y-2" aria-label="Suggested questions">
            {DOCK_QUESTIONS.map((question) => (
              <Link
                key={question}
                to="/ask"
                search={{ question }}
                onClick={() => setPanel(null)}
                className="flex min-h-11 items-center border border-border bg-muted/40 px-3 text-left text-sm font-medium transition-colors duration-200 hover:bg-muted"
              >
                {question}
              </Link>
            ))}
          </div>
          <Button asChild className="mt-4 w-full rounded-full">
            <Link to="/ask">Start a conversation</Link>
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Sign-in may be required to use the assistant.
          </p>
        </div>
      ) : null}

      {panel === "accessibility" ? (
        <div
          className="mb-1 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border bg-card p-4 shadow-2xl"
          role="dialog"
          aria-labelledby="accessibility-widget-title"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="accessibility-widget-title" className="font-bold">
              Accessibility options
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setPanel(null)}
              aria-label="Close accessibility options"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Text size</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9"
                  onClick={() =>
                    updatePreferences({
                      ...preferences,
                      textScale: Math.max(90, preferences.textScale - 10),
                    })
                  }
                  aria-label="Decrease text size"
                >
                  <Minus aria-hidden="true" />
                </Button>
                <span className="w-10 text-center text-sm tabular-nums">
                  {preferences.textScale}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9"
                  onClick={() =>
                    updatePreferences({
                      ...preferences,
                      textScale: Math.min(130, preferences.textScale + 10),
                    })
                  }
                  aria-label="Increase text size"
                >
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            </div>
            <label className="flex items-center justify-between gap-4 text-sm font-medium">
              High contrast
              <Switch
                checked={preferences.highContrast}
                onCheckedChange={(checked) =>
                  updatePreferences({ ...preferences, highContrast: checked })
                }
                aria-label="High contrast"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm font-medium">
              Reduce motion
              <Switch
                checked={preferences.reduceMotion}
                onCheckedChange={(checked) =>
                  updatePreferences({ ...preferences, reduceMotion: checked })
                }
                aria-label="Reduce motion"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => updatePreferences(DEFAULT_PREFERENCES)}
            >
              Reset options
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-full border border-[var(--institution-accent)]/35 bg-card/95 p-1.5 shadow-xl backdrop-blur">
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          aria-label="Ask JESUP"
          aria-expanded={panel === "ask"}
          onClick={() => setPanel(panel === "ask" ? null : "ask")}
        >
          <MessageCircle aria-hidden="true" />
          <span className="hidden sm:inline">Ask JESUP</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Accessibility options"
          aria-expanded={panel === "accessibility"}
          onClick={() => setPanel(panel === "accessibility" ? null : "accessibility")}
        >
          <Accessibility aria-hidden="true" />
        </Button>
      </div>
    </aside>
  );
}
