import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getInstitutionById } from "@/lib/institutions";
import { getMyProfile } from "@/lib/profile";
import {
  JESUP_NETWORK_THEME,
  hasRecognizedInstitutionTheme,
  resolveInstitutionTheme,
  type InstitutionTheme,
} from "@/lib/institution-theme";

type InstitutionThemeContextValue = {
  theme: InstitutionTheme;
  institutionName: string | null;
  institutionId: string | null;
  isGuest: boolean;
  hasInstitutionTheme: boolean;
};

const InstitutionThemeContext = createContext<InstitutionThemeContextValue>({
  theme: JESUP_NETWORK_THEME,
  institutionName: null,
  institutionId: null,
  isGuest: true,
  hasInstitutionTheme: false,
});

export function InstitutionThemeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: () => getMyProfile(user!.id),
  });
  const { data: institution } = useQuery({
    queryKey: ["institution", profile?.institutionId],
    enabled: !!profile?.institutionId,
    queryFn: () => getInstitutionById(profile!.institutionId!),
  });

  const institutionName = institution?.name ?? profile?.schoolName ?? null;
  const theme = useMemo(
    () => (user ? resolveInstitutionTheme(institutionName) : JESUP_NETWORK_THEME),
    [institutionName, user],
  );
  const hasInstitutionTheme = hasRecognizedInstitutionTheme(theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.institutionTheme = theme.key;
    root.dataset.institutionSelected = String(hasInstitutionTheme);

    const themedProperties: Record<string, string> = {
      "--institution-accent": theme.accent,
      "--institution-accent-strong": theme.accentStrong,
      "--institution-accent-soft": `color-mix(in srgb, ${theme.accent} 14%, var(--background))`,
      "--institution-accent-foreground": theme.accentForeground,
      "--institution-secondary": theme.secondary,
      "--primary": theme.accentStrong,
      "--primary-mid": theme.accent,
      "--primary-bright": theme.secondary,
      "--primary-foreground": theme.accentForeground,
      "--accent": theme.accent,
      "--accent-foreground": theme.accentForeground,
      "--ring": theme.accent,
      "--gradient-jesup": `linear-gradient(115deg, ${theme.accentStrong} 0%, ${theme.accent} 72%, ${theme.secondary} 135%)`,
      "--gradient-jesup-soft": `linear-gradient(115deg, color-mix(in srgb, ${theme.accentStrong} 88%, transparent) 0%, color-mix(in srgb, ${theme.accent} 82%, transparent) 72%, color-mix(in srgb, ${theme.secondary} 45%, transparent) 135%)`,
    };

    Object.entries(themedProperties).forEach(([property, value]) => {
      if (hasInstitutionTheme) root.style.setProperty(property, value);
      else root.style.removeProperty(property);
    });
  }, [hasInstitutionTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      institutionName,
      institutionId: profile?.institutionId ?? null,
      isGuest: !loading && !user,
      hasInstitutionTheme,
    }),
    [theme, institutionName, profile?.institutionId, loading, user, hasInstitutionTheme],
  );

  return (
    <InstitutionThemeContext.Provider value={value}>{children}</InstitutionThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider hook is intentionally colocated.
export function useInstitutionTheme() {
  return useContext(InstitutionThemeContext);
}
