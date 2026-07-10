export const DEMOGRAPHIC_PRIVACY_NOTICE =
  "Providing demographic information is optional. JESUP uses this information in aggregate to evaluate programs, support Extension reporting, and meet approved funding requirements. Individual demographic responses are not displayed publicly.";

export function PrivacyNotice({ className }: { className?: string }) {
  return (
    <p className={className ?? "rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm leading-relaxed text-muted-foreground"}>
      {DEMOGRAPHIC_PRIVACY_NOTICE}
    </p>
  );
}
