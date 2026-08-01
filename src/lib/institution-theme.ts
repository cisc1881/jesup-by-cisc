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
  accent: "oklch(0.64 0.12 78)",
  accentStrong: "oklch(0.54 0.12 72)",
  accentSoft: "oklch(0.94 0.035 82)",
  accentForeground: "oklch(0.18 0.025 265)",
  secondary: "oklch(0.40 0.14 272)",
};

type ThemeRule = InstitutionTheme & { matches: string[] };

// School colors are intentionally used as accents. JESUP's navy/indigo shell
// remains constant so a multi-institution event still feels like one platform.
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
    secondary: "#4b5563",
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
    accent: "#004b8d",
    accentStrong: "#00315d",
    accentSoft: "#e7f0f7",
    accentForeground: "#ffffff",
    secondary: "#ffffff",
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
    accent: "#5b2c83",
    accentStrong: "#3d1d59",
    accentSoft: "#f0eaf5",
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
    accent: "#f4c430",
    accentStrong: "#a87800",
    accentSoft: "#fff6d9",
    accentForeground: "#181818",
    secondary: "#111827",
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
      label: name!.trim(),
    }
  );
}
