import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getInstitutionById } from "@/lib/institutions";
import { getMyProfile } from "@/lib/profile";
import {
  JESUP_NETWORK_THEME,
  resolveInstitutionTheme,
  type InstitutionTheme,
} from "@/lib/institution-theme";

type InstitutionThemeContextValue = {
  theme: InstitutionTheme;
  institutionName: string | null;
  institutionId: string | null;
  isGuest: boolean;
};

const InstitutionThemeContext = createContext<InstitutionThemeContextValue>({
  theme: JESUP_NETWORK_THEME,
  institutionName: null,
  institutionId: null,
  isGuest: true,
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

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.institutionTheme = theme.key;
    root.style.setProperty("--institution-accent", theme.accent);
    root.style.setProperty("--institution-accent-strong", theme.accentStrong);
    root.style.setProperty("--institution-accent-soft", theme.accentSoft);
    root.style.setProperty("--institution-accent-foreground", theme.accentForeground);
    root.style.setProperty("--institution-secondary", theme.secondary);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      institutionName,
      institutionId: profile?.institutionId ?? null,
      isGuest: !loading && !user,
    }),
    [theme, institutionName, profile?.institutionId, loading, user],
  );

  return (
    <InstitutionThemeContext.Provider value={value}>{children}</InstitutionThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider hook is intentionally colocated.
export function useInstitutionTheme() {
  return useContext(InstitutionThemeContext);
}
