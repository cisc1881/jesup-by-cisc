export type InstitutionTheme = {
  key: string;
  label: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentForeground: string;
  secondary: string;
};

export const JESUP_NETWORK_THEME: InstitutionTheme = {
  key: "jesup-network",
  label: "1890 Land-Grant Network",
  accent: "#202020",
  accentStrong: "#171717",
  accentSoft: "#eeeeee",
  accentForeground: "#ffffff",
  secondary: "#e5e5e5",
};

type ThemeRule = InstitutionTheme & { matches: string[] };

// School colors are applied only after a recognized institution is selected.
// The unaffiliated network experience stays intentionally neutral.
const INSTITUTION_THEMES: ThemeRule[] = [
  {
    key: "alabama-am",
    label: "Alabama A&M University",
    matches: ["alabama a&m", "alabama agricultural and mechanical"],
    accent: "#7a0019",
    accentStrong: "#5d0013",
    accentSoft: "#f7e9ed",
    accentForeground: "#ffffff",
    secondary: "#d5d9dd",
  },
  {
    key: "alcorn",
    label: "Alcorn State University",
    matches: ["alcorn state"],
    accent: "#5b2c83",
    accentStrong: "#3f1e5c",
    accentSoft: "#f0eaf5",
    accentForeground: "#ffffff",
    secondary: "#f4c430",
  },
  {
    key: "central-state",
    label: "Central State University",
    matches: ["central state"],
    accent: "#7b1e3a",
    accentStrong: "#58142a",
    accentSoft: "#f7ebef",
    accentForeground: "#ffffff",
    secondary: "#f2c14e",
  },
  {
    key: "delaware-state",
    label: "Delaware State University",
    matches: ["delaware state"],
    accent: "#b11f3a",
    accentStrong: "#7d1629",
    accentSoft: "#fae9ed",
    accentForeground: "#ffffff",
    secondary: "#00a9ce",
  },
  {
    key: "famu",
    label: "Florida A&M University",
    matches: ["florida a&m", "florida agricultural and mechanical"],
    accent: "#f15a22",
    accentStrong: "#b83a0b",
    accentSoft: "#fff0e9",
    accentForeground: "#1b1b1b",
    secondary: "#00613c",
  },
  {
    key: "fort-valley",
    label: "Fort Valley State University",
    matches: ["fort valley state"],
    accent: "#0033a0",
    accentStrong: "#00216b",
    accentSoft: "#e9effb",
    accentForeground: "#ffffff",
    secondary: "#f2b705",
  },
  {
    key: "kentucky-state",
    label: "Kentucky State University",
    matches: ["kentucky state"],
    accent: "#1f6b42",
    accentStrong: "#14472c",
    accentSoft: "#e8f3ed",
    accentForeground: "#ffffff",
    secondary: "#f0c341",
  },
  {
    key: "langston",
    label: "Langston University",
    matches: ["langston university"],
    accent: "#f28c28",
    accentStrong: "#b65a0c",
    accentSoft: "#fff1e3",
    accentForeground: "#171717",
    secondary: "#1b4f9c",
  },
  {
    key: "lincoln-mo",
    label: "Lincoln University of Missouri",
    matches: ["lincoln university of missouri", "lincoln university (mo"],
    accent: "#003b71",
    accentStrong: "#002747",
    accentSoft: "#e8f0f7",
    accentForeground: "#ffffff",
    secondary: "#d4af37",
  },
  {
    key: "ncat",
    label: "North Carolina A&T State University",
    matches: ["north carolina a&t", "north carolina agricultural and technical"],
    accent: "#004684",
    accentStrong: "#002d56",
    accentSoft: "#e7f0f7",
    accentForeground: "#ffffff",
    secondary: "#f2b134",
  },
  {
    key: "prairie-view",
    label: "Prairie View A&M University",
    matches: ["prairie view a&m"],
    accent: "#4f2683",
    accentStrong: "#35195a",
    accentSoft: "#efe9f5",
    accentForeground: "#ffffff",
    secondary: "#f6c344",
  },
  {
    key: "south-carolina-state",
    label: "South Carolina State University",
    matches: ["south carolina state"],
    accent: "#7c1835",
    accentStrong: "#551025",
    accentSoft: "#f7e9ee",
    accentForeground: "#ffffff",
    secondary: "#1f4e8c",
  },
  {
    key: "southern",
    label: "Southern University",
    matches: ["southern university"],
    accent: "#00539b",
    accentStrong: "#003767",
    accentSoft: "#e7f1f8",
    accentForeground: "#ffffff",
    secondary: "#f6c343",
  },
  {
    key: "tennessee-state",
    label: "Tennessee State University",
    matches: ["tennessee state"],
    accent: "#c8102e",
    accentStrong: "#8a001b",
    accentSoft: "#f9e8eb",
    accentForeground: "#ffffff",
    secondary: "#00539b",
  },
  {
    key: "tuskegee",
    label: "Tuskegee University",
    matches: ["tuskegee"],
    accent: "#8b0015",
    accentStrong: "#61000f",
    accentSoft: "#f8e9ec",
    accentForeground: "#ffffff",
    secondary: "#e6b31e",
  },
  {
    key: "arkansas-pine-bluff",
    label: "University of Arkansas at Pine Bluff",
    matches: ["arkansas at pine bluff", "uapb"],
    accent: "#1b1b1b",
    accentStrong: "#000000",
    accentSoft: "#eeeeee",
    accentForeground: "#ffffff",
    secondary: "#f2c230",
  },
  {
    key: "maryland-eastern-shore",
    label: "University of Maryland Eastern Shore",
    matches: ["maryland eastern shore", "umes"],
    accent: "#7b1e3a",
    accentStrong: "#551429",
    accentSoft: "#f7e9ee",
    accentForeground: "#ffffff",
    secondary: "#b0b7bd",
  },
  {
    key: "virginia-state",
    label: "Virginia State University",
    matches: ["virginia state"],
    accent: "#f47c20",
    accentStrong: "#b84f08",
    accentSoft: "#fff0e5",
    accentForeground: "#171717",
    secondary: "#17365d",
  },
  {
    key: "west-virginia-state",
    label: "West Virginia State University",
    matches: ["west virginia state"],
    accent: "#1b1b1b",
    accentStrong: "#000000",
    accentSoft: "#eeeeee",
    accentForeground: "#ffffff",
    secondary: "#f4c430",
  },
];

export function resolveInstitutionTheme(name?: string | null): InstitutionTheme {
  const normalized = name?.trim().toLowerCase();
  if (!normalized) return JESUP_NETWORK_THEME;
  return (
    INSTITUTION_THEMES.find((theme) =>
      theme.matches.some((match) => normalized.includes(match)),
    ) ?? {
      ...JESUP_NETWORK_THEME,
      key: "affiliated-institution",
      label: name?.trim() ?? JESUP_NETWORK_THEME.label,
    }
  );
}

export function hasRecognizedInstitutionTheme(theme: InstitutionTheme): boolean {
  return theme.key !== JESUP_NETWORK_THEME.key && theme.key !== "affiliated-institution";
}

export function getReadableForeground(background: string): "#171717" | "#ffffff" {
  const hex = background.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(hex)) return "#ffffff";

  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  const darkChannel = 23 / 255;
  const darkLuminance = ((darkChannel + 0.055) / 1.055) ** 2.4;
  const darkContrast = (luminance + 0.05) / (darkLuminance + 0.05);
  const lightContrast = 1.05 / (luminance + 0.05);

  return darkContrast >= lightContrast ? "#171717" : "#ffffff";
}

type ThemeContent = {
  institutionIds?: string[];
  metadata?: Record<string, unknown>;
  themeAccent?: string | null;
  themeSecondary?: string | null;
};

/** Content must never select a school for the viewer. */
export function resolveContentTheme(_content: ThemeContent, selectedSchool?: string | null): InstitutionTheme {
  return resolveInstitutionTheme(selectedSchool);
}

/** Every theme supplies paired surfaces; dark-mode links differ from filled banner colors. */
export function institutionThemeProperties(theme: InstitutionTheme, dark = false): Record<string, string> {
  const network = theme.key === "jesup-network" || theme.key === "affiliated-institution";
  const primary = dark ? `color-mix(in srgb, ${theme.accent} 35%, #ffffff)` : theme.accentStrong;
  const mid = dark ? `color-mix(in srgb, ${theme.accent} 25%, #ffffff)` : theme.accentStrong;
  return {
    "--primary": primary, "--primary-mid": mid, "--primary-bright": theme.secondary,
    "--primary-foreground": dark ? "#171717" : getReadableForeground(theme.accentStrong),
    "--accent": theme.accent, "--accent-foreground": getReadableForeground(theme.accent),
    "--secondary": theme.secondary, "--secondary-foreground": getReadableForeground(theme.secondary),
    "--institution-accent": theme.accent, "--institution-accent-strong": primary,
    "--institution-accent-foreground": getReadableForeground(theme.accent),
    "--institution-accent-soft": `color-mix(in srgb, ${theme.accent} 12%, var(--card))`,
    "--institution-secondary": theme.secondary,
    "--institution-secondary-foreground": getReadableForeground(theme.secondary),
    "--institution-surface-primary": `color-mix(in srgb, ${theme.accent} 10%, var(--card))`,
    "--institution-surface-secondary": `color-mix(in srgb, ${theme.secondary} 10%, var(--card))`,
    "--institution-surface-split": `linear-gradient(115deg, color-mix(in srgb, ${theme.accent} 10%, var(--card)), color-mix(in srgb, ${theme.secondary} 10%, var(--card)))`,
    "--institution-border-primary": `color-mix(in srgb, ${theme.accent} 35%, var(--border))`,
    "--institution-border-secondary": `color-mix(in srgb, ${theme.secondary} 35%, var(--border))`,
    "--ring": dark ? primary : theme.accent,
    "--gradient-jesup": network ? "var(--jesup-banner-gradient)" : `linear-gradient(115deg, ${primary}, ${mid})`,
    "--gradient-crimson": "var(--gradient-jesup)",
    "--gradient-crimson-soft": "var(--gradient-jesup-soft)",
    "--gradient-foreground": network ? "var(--guest-gradient-foreground)" : dark ? "#171717" : getReadableForeground(theme.accentStrong),
    "--gradient-hero-institution": network ? "var(--jesup-banner-gradient)" : `linear-gradient(115deg, ${primary}, ${mid})`,
    "--gradient-jesup-soft": network ? "var(--jesup-banner-gradient)" : `linear-gradient(115deg, ${primary}, ${mid})`,
    "--entry-gradient": network ? "var(--jesup-splash-gradient)" : `linear-gradient(115deg, ${theme.accentStrong}, ${theme.accent})`,
    "--banner-background": network ? "var(--jesup-banner-gradient)" : theme.accentStrong,
    "--banner-solid": network ? "#102b3e" : theme.accentStrong,
    "--banner-foreground": network ? "#ffffff" : getReadableForeground(theme.accentStrong),
    "--banner-highlight": network ? "#ffffff" : theme.secondary,
    "--banner-highlight-foreground": getReadableForeground(theme.secondary),
    "--home-gradient": network ? "var(--jesup-banner-gradient)" : `linear-gradient(115deg, ${theme.accentStrong}, ${theme.accent})`,
    "--home-foreground": network ? "#ffffff" : getReadableForeground(theme.accentStrong),
    "--home-muted": network ? "#ffffff" : getReadableForeground(theme.accentStrong),
    "--home-cta": theme.secondary,
    "--home-cta-foreground": getReadableForeground(theme.secondary),
  };
}
