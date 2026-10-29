/** External wallet adapters operate on an issued Jesup pass, never on raw registration data. */
export type ExternalWalletPlatform = "apple" | "google";

export type WalletPassExport = {
  passId: string;
  platform: ExternalWalletPlatform;
  downloadUrl: string;
  externalId: string;
  expiresAt: string | null;
};

export type WalletPassInput = {
  id: string;
  token: string;
  kind: string;
  title: string;
  subtitle: string | null;
  validFrom: string | null;
  validUntil: string | null;
};

export interface ExternalWalletProvider {
  readonly platform: ExternalWalletPlatform;
  isConfigured(): boolean;
  issue(input: WalletPassInput): Promise<WalletPassExport>;
  revoke(externalId: string): Promise<void>;
}

export function availableWalletPlatforms(
  providers: ExternalWalletProvider[],
): ExternalWalletPlatform[] {
  return providers
    .filter((provider) => provider.isConfigured())
    .map((provider) => provider.platform);
}
