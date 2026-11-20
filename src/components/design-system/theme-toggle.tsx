import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { AppButton } from "./app-button";

/** One-tap theme switch shared by public and account navigation. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <AppButton
      type="button"
      variant="outline"
      size="icon"
      shape="square"
      className="min-h-11 min-w-11 shrink-0"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </AppButton>
  );
}
