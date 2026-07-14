export type VapidServerConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export class VapidConfigurationError extends Error {
  readonly code = "vapid-configuration-missing" as const;

  constructor(message: string) {
    super(message);
    this.name = "VapidConfigurationError";
  }
}

export function getClientVapidPublicKey(): string | null {
  const value = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  return value?.trim() || null;
}

export function isClientVapidConfigured(): boolean {
  return Boolean(getClientVapidPublicKey());
}

export function getServerVapidConfig(): VapidServerConfig {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY?.trim() || process.env.VITE_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:info@accessfarmtotable.com";

  const missing: string[] = [];
  if (!publicKey) missing.push("VAPID_PUBLIC_KEY");
  if (!privateKey) missing.push("VAPID_PRIVATE_KEY");
  if (!subject) missing.push("VAPID_SUBJECT");

  if (missing.length > 0) {
    throw new VapidConfigurationError(
      `Development Web Push is not configured. Missing: ${missing.join(", ")}. Run: node scripts/generate-vapid-keys.mjs`,
    );
  }

  return { publicKey: publicKey!, privateKey: privateKey!, subject };
}

export function tryGetServerVapidConfig(): VapidServerConfig | null {
  try {
    return getServerVapidConfig();
  } catch {
    return null;
  }
}
