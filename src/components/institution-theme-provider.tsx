import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode, type CSSProperties } from "react";
import { useMatches } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import { getInstitutionById } from "@/lib/institutions";
import { getMyProfile } from "@/lib/profile";
import {
  JESUP_NETWORK_THEME,
  institutionThemeProperties,
  resolveContentTheme,
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
  const { resolvedTheme } = useTheme();
  const matches = useMatches();
  const contentMatch = [...matches].reverse().find((match) => match.routeId === "/events/$id" || match.routeId === "/programs/$slug");
  const loader = contentMatch?.loaderData as { event?: ThemeContent | null; program?: ThemeContent | null } | undefined;
  const content = loader?.event ?? loader?.program;
  const ownerId = content?.institutionIds?.length === 1 ? content.institutionIds[0] : undefined;
  const { data: owner } = useQuery({ queryKey: ["institution", ownerId], enabled: Boolean(ownerId),
    queryFn: () => ownerId ? getInstitutionById(ownerId) : Promise.resolve(null) });
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: () => user ? getMyProfile(user.id) : Promise.resolve(null),
  });
  const { data: institution } = useQuery({
    queryKey: ["institution", profile?.institutionId],
    enabled: !!profile?.institutionId,
    queryFn: () => profile?.institutionId ? getInstitutionById(profile.institutionId) : Promise.resolve(null),
  });

  const institutionName = institution?.name ?? profile?.schoolName ?? null;
  const theme = useMemo(
    () => content ? resolveContentTheme(content, owner?.name) : user ? resolveInstitutionTheme(institutionName) : JESUP_NETWORK_THEME,
    [content, owner?.name, institutionName, user],
  );
  const hasInstitutionTheme = hasRecognizedInstitutionTheme(theme);

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
    <InstitutionThemeContext.Provider value={value}>
      <div className="contents" data-institution-theme={theme.key} style={institutionThemeProperties(theme, resolvedTheme === "dark") as CSSProperties}>{children}</div>
    </InstitutionThemeContext.Provider>
  );
}

type ThemeContent = { institutionIds?: string[]; metadata?: Record<string, unknown>; themeAccent?: string | null; themeSecondary?: string | null };

/** A featured item can carry its brand without changing the surrounding network. */
export function ContentThemeScope({ content, children }: { content: ThemeContent; children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const theme = resolveContentTheme(content);
  return <div className="contents" data-content-theme={theme.key} style={institutionThemeProperties(theme, resolvedTheme === "dark") as CSSProperties}>{children}</div>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider hook is intentionally colocated.
export function useInstitutionTheme() {
  return useContext(InstitutionThemeContext);
}
