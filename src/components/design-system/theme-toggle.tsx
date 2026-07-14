import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { AppButton } from "./app-button";

/** Optional control for settings/profile screens — not wired into nav yet. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <AppButton
      type="button"
      variant="outline"
      size="icon"
      shape="square"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </AppButton>
  );
}
