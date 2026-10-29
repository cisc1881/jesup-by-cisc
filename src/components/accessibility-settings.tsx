import { useEffect, useState } from "react";

type Preferences = { largeText: boolean; highContrast: boolean; reducedMotion: boolean };
const key = "jesup-accessibility";
const defaults: Preferences = { largeText: false, highContrast: false, reducedMotion: false };

export function AccessibilitySettings() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<Preferences> | null;
      if (saved) setPreferences({ ...defaults, ...saved });
    } catch {
      // Keep usable defaults when local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.jesupLargeText = String(preferences.largeText);
    root.dataset.jesupHighContrast = String(preferences.highContrast);
    root.dataset.jesupReducedMotion = String(preferences.reducedMotion);
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
      /* Settings remain active for this visit. */
    }
  }, [preferences]);

  return (
    <fieldset className="border-t pt-5">
      <legend className="text-sm font-black">Accessibility settings</legend>
      <p className="mt-2 text-xs text-muted-foreground">
        Adjust Jesup for this device. Your choices are saved here.
      </p>
      <div className="mt-3 space-y-1">
        {(
          [
            ["largeText", "Larger text"],
            ["highContrast", "Higher contrast"],
            ["reducedMotion", "Reduce motion"],
          ] as const
        ).map(([name, label]) => (
          <label
            key={name}
            className="flex min-h-12 items-center gap-3 rounded-lg px-2 text-sm font-semibold hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={preferences[name]}
              onChange={(event) =>
                setPreferences((current) => ({ ...current, [name]: event.target.checked }))
              }
              className="h-5 w-5 accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
