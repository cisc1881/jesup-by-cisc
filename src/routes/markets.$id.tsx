import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer, AppButton } from "@/components/design-system";
import {
  MarketAnnouncements,
  MarketContactSection,
  MarketDescription,
  MarketDetailHero,
  MarketGallery,
  MarketHoursSection,
  MarketMapView,
  MarketNearbySection,
  MarketPaymentsSection,
  MarketRelatedSections,
  MarketVendorsSection,
} from "@/components/markets";
import { useFavoriteMarkets } from "@/hooks/use-favorite-markets";
import { useMarketReminders } from "@/hooks/use-market-reminders";
import { useUserLocation } from "@/hooks/use-user-location";
import { fetchMarketById } from "@/lib/markets";
import { shareMarket } from "@/lib/market-geo";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/markets/$id")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.market ? `${loaderData.market.name} · Farmers Markets · JESUP` : "Market · JESUP",
      },
      { name: "description", content: loaderData?.market?.description ?? "Farmers market details from CISC." },
    ],
  }),
  loader: async ({ params }) => {
    const market = await fetchMarketById(params.id);
    return { market };
  },
  component: MarketDetailPage,
});

function MarketDetailPage() {
  const { id } = Route.useParams();
  const { market: initialMarket } = Route.useLoaderData();
  const { coords, refresh, loading: locating } = useUserLocation();
  const { isSaved, toggleSaved } = useFavoriteMarkets();
  const { hasReminder, toggleReminder } = useMarketReminders();

  const market = initialMarket;

  if (!market) {
    return (
      <PublicLayout>
        <PageContainer size="md" className="py-16 text-center">
          <h1 className="text-2xl font-bold">Market not found</h1>
          <AppButton variant="outline" className="mt-6" asChild>
            <Link to="/markets">Back to markets</Link>
          </AppButton>
        </PageContainer>
      </PublicLayout>
    );
  }

  async function handleShare() {
    try {
      await shareMarket(market);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not share market");
    }
  }

  function handleReminder() {
    const added = toggleReminder(id);
    toast.success(added ? "Reminder saved — we'll nudge you before market day" : "Reminder removed");
  }

  return (
    <PublicLayout>
      <PageContainer size="lg" className="space-y-10 pb-bottom-nav md:space-y-12 md:pb-[var(--page-py)]">
        <AppButton variant="ghost" size="sm" shape="pill" className="w-fit" asChild>
          <Link to="/markets">
            <ArrowLeft className="h-4 w-4" />
            All markets
          </Link>
        </AppButton>

        <MarketDetailHero
          market={market}
          saved={isSaved(id)}
          onToggleSaved={() => void toggleSaved(id)}
          hasReminder={hasReminder(id)}
          onToggleReminder={handleReminder}
          onShare={() => void handleShare()}
        />

        <div className="space-y-10">
          <MarketAnnouncements market={market} />
          <MarketDescription market={market} />
          <MarketHoursSection market={market} />
          <MarketPaymentsSection market={market} />
          <MarketContactSection market={market} />
          <MarketVendorsSection market={market} />
          <MarketGallery market={market} />
          {(market.lat != null || market.address) && (
            <MarketMapView
              markets={[market, ...market.nearbyMarkets]}
              userCoords={coords}
              onLocate={refresh}
              locating={locating}
            />
          )}
          <MarketRelatedSections market={market} />
          <MarketNearbySection market={market} />
        </div>
      </PageContainer>
    </PublicLayout>
  );
}
