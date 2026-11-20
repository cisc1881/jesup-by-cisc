import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { GUEST_SCHOOL_KEY, readSessionValue, writeSessionValue } from "@/lib/entry-session";
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
  institutionSlug: string | null;
  isGuest: boolean;
  hasInstitutionTheme: boolean;
  selectGuestSchool: (name: string | null) => void;
};

const InstitutionThemeContext = createContext<InstitutionThemeContextValue>({
  theme: JESUP_NETWORK_THEME,
  institutionName: null,
  institutionId: null,
  institutionSlug: null,
  isGuest: false,
  hasInstitutionTheme: false,
  selectGuestSchool: () => {},
});

export function InstitutionThemeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [guestSchool, setGuestSchool] = useState<string | null>(null);
  useEffect(() => {
    setGuestSchool(readSessionValue(GUEST_SCHOOL_KEY));
  }, []);
  const selectGuestSchool = (name: string | null) => {
    setGuestSchool(name);
    writeSessionValue(GUEST_SCHOOL_KEY, name ?? "");
  };
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: () => (user ? getMyProfile(user.id) : Promise.resolve(null)),
  });
  const { data: institution } = useQuery({
    queryKey: ["institution", profile?.institutionId],
    enabled: !!profile?.institutionId,
    queryFn: () =>
      profile?.institutionId ? getInstitutionById(profile.institutionId) : Promise.resolve(null),
  });

  const institutionName = user
    ? (institution?.name ?? profile?.schoolName ?? null)
    : guestSchool || null;
  const theme = useMemo(() => resolveInstitutionTheme(institutionName), [institutionName]);
  const hasInstitutionTheme = hasRecognizedInstitutionTheme(theme);

  const value = useMemo(
    () => ({
      theme,
      institutionName,
      institutionId: profile?.institutionId ?? null,
      institutionSlug: institution?.slug ?? null,
      isGuest: !loading && !user,
      hasInstitutionTheme,
      selectGuestSchool,
    }),
    [
      theme,
      institutionName,
      profile?.institutionId,
      institution?.slug,
      loading,
      user,
      hasInstitutionTheme,
    ],
  );

  return (
    <InstitutionThemeContext.Provider value={value}>
      <div className="contents" data-institution-theme={theme.key}>
        {children}
      </div>
    </InstitutionThemeContext.Provider>
  );
}

type ThemeContent = {
  institutionIds?: string[];
  metadata?: Record<string, unknown>;
  themeAccent?: string | null;
  themeSecondary?: string | null;
};

/** Featured content inherits selection; ownership never activates institution colors. */
export function ContentThemeScope({ children }: { content: ThemeContent; children: ReactNode }) {
  const { theme } = useInstitutionTheme();
  return (
    <div className="contents" data-content-theme={theme.key}>
      {children}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider hook is intentionally colocated.
export function useInstitutionTheme() {
  return useContext(InstitutionThemeContext);
}
