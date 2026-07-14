import type { CountyPreparedness } from "@/lib/weather/types";
import { AppBadge, AppButton, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/design-system";
import { Copy, ExternalLink, MapPinned, Phone, Shield } from "lucide-react";
import { toast } from "sonner";

type CountyPreparednessCardProps = {
  preparedness: CountyPreparedness;
  onChangeCounty?: () => void;
};

export function CountyPreparednessCard({ preparedness, onChangeCounty }: CountyPreparednessCardProps) {
  const telHref = preparedness.phone ? `tel:${preparedness.phone.replace(/\D/g, "")}` : null;
  const isVerified = preparedness.verificationStatus === "verified" && preparedness.contactAvailable;

  async function copyPhone() {
    if (!preparedness.phone) return;
    try {
      await navigator.clipboard.writeText(preparedness.phone);
      toast.success("Phone number copied");
    } catch {
      toast.error("Could not copy phone number");
    }
  }

  return (
    <AppCard padding="md" className="h-full">
      <AppCardHeader>
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AppCardTitle>{preparedness.countyName} preparedness</AppCardTitle>
              {isVerified ? (
                <AppBadge variant="secondary" className="text-xs uppercase">
                  Verified county
                </AppBadge>
              ) : (
                <AppBadge variant="outline" className="border-dashed text-xs uppercase">
                  Generic guidance
                </AppBadge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{preparedness.agencyName}</p>
            {isVerified && preparedness.phone ? (
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{preparedness.phone}</p>
            ) : (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Verified local emergency-management contact not yet available
              </p>
            )}
            {preparedness.sourceName ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Source: {preparedness.sourceUrl ? (
                  <a
                    href={preparedness.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {preparedness.sourceName}
                  </a>
                ) : (
                  preparedness.sourceName
                )}
              </p>
            ) : null}
            {preparedness.lastReviewedLabel ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{preparedness.lastReviewedLabel}</p>
            ) : null}
          </div>
        </div>
      </AppCardHeader>
      <AppCardContent className="space-y-4">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          {preparedness.guidance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          {isVerified && telHref ? (
            <>
              <AppButton asChild size="md" className="min-h-11 min-w-11">
                <a href={telHref}>
                  <Phone aria-hidden="true" />
                  Call agency
                </a>
              </AppButton>
              <AppButton type="button" variant="outline" size="md" className="min-h-11" onClick={copyPhone}>
                <Copy aria-hidden="true" />
                Copy phone
              </AppButton>
            </>
          ) : (
            <>
              {onChangeCounty ? (
                <AppButton type="button" variant="outline" size="md" className="min-h-11" onClick={onChangeCounty}>
                  <MapPinned aria-hidden="true" />
                  Change location
                </AppButton>
              ) : null}
              <AppButton asChild variant="outline" size="md" className="min-h-11">
                <a
                  href="https://www.google.com/search?q=local+emergency+management+agency"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink aria-hidden="true" />
                  Search local emergency management
                </a>
              </AppButton>
              <AppButton asChild size="md" className="min-h-11">
                <a href="tel:911">
                  <Phone aria-hidden="true" />
                  Call 911
                </a>
              </AppButton>
            </>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">Emergency disclaimer: </strong>
          For life-threatening emergencies, call 911. Phone numbers are shown only for verified county
          records with documented sources.
        </p>
      </AppCardContent>
    </AppCard>
  );
}
