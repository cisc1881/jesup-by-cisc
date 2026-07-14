import { supabase } from "@/integrations/supabase/client";
import type { PlatformSettingKey } from "@/modules/cms";

export type OrganizationSettings = {
  name: string;
  institution: string;
  tagline: string;
};

export type BrandSettings = {
  primaryColor: string;
  accentColor: string;
};

export type HomepageSettings = {
  heroEnabled: boolean;
};

export type NavigationSettings = {
  showDonate: boolean;
};

export type MapsSettings = {
  provider: "google" | "apple";
};

export type QualtricsSettings = {
  enabled: boolean;
  baseUrl?: string | null;
};

export type AiSettings = {
  enabled: boolean;
  provider: "openai" | "anthropic" | null;
};

export type EmailSettings = {
  fromName: string;
  fromAddress: string | null;
};

export type StorageSettings = {
  defaultBucket: string;
};

export type PlatformSettings = {
  organization: OrganizationSettings;
  brand: BrandSettings;
  homepage: HomepageSettings;
  navigation: NavigationSettings;
  maps: MapsSettings;
  qualtrics: QualtricsSettings;
  ai: AiSettings;
  email: EmailSettings;
  storage: StorageSettings;
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  organization: {
    name: "Carver Integrative Sustainability Center",
    institution: "Tuskegee University",
    tagline: "The Digital Extension Wagon",
  },
  brand: { primaryColor: "#7A0C16", accentColor: "#C4A035" },
  homepage: { heroEnabled: true },
  navigation: { showDonate: true },
  maps: { provider: "google" },
  qualtrics: { enabled: false, baseUrl: null },
  ai: { enabled: false, provider: null },
  email: { fromName: "JESUP", fromAddress: null },
  storage: { defaultBucket: "media-library" },
};

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.from("platform_settings").select("key, value");
  if (error) throw error;

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) {
    const key = row.key as PlatformSettingKey;
    if (key in settings) {
      (settings as Record<string, unknown>)[key] = {
        ...((settings as Record<string, unknown>)[key] as object),
        ...(row.value as object),
      };
    }
  }
  return settings;
}

export async function savePlatformSetting<K extends PlatformSettingKey>(
  key: K,
  value: PlatformSettings[K],
) {
  const { error } = await supabase.from("platform_settings").upsert({
    key,
    value: value as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export const SETTINGS_SECTIONS = [
  {
    key: "organization" as const,
    label: "Organization Profile",
    description: "CISC and Tuskegee University identity",
  },
  {
    key: "brand" as const,
    label: "Brand Assets",
    description: "Colors, logos, and visual identity",
  },
  {
    key: "homepage" as const,
    label: "Homepage",
    description: "Hero, sections, and featured content",
  },
  {
    key: "navigation" as const,
    label: "Navigation",
    description: "Public site navigation and menus",
  },
  { key: "maps" as const, label: "Google Maps", description: "Map provider and API configuration" },
  { key: "qualtrics" as const, label: "Qualtrics", description: "Survey integration settings" },
  { key: "ai" as const, label: "AI", description: "AI services and provider configuration" },
  { key: "email" as const, label: "Email", description: "Email delivery and sender settings" },
  { key: "storage" as const, label: "Storage", description: "Media storage buckets and limits" },
] as const;
