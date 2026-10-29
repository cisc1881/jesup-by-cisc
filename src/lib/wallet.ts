export type WalletPassState = "active" | "upcoming" | "expired" | "used" | "revoked";

export function walletPassState(
  pass: {
    status: "active" | "used" | "expired" | "revoked";
    valid_from: string | null;
    valid_until: string | null;
  },
  now = new Date(),
): WalletPassState {
  if (pass.status !== "active") return pass.status;
  if (pass.valid_until && Date.parse(pass.valid_until) < now.getTime()) return "expired";
  if (pass.valid_from && Date.parse(pass.valid_from) > now.getTime()) return "upcoming";
  return "active";
}
