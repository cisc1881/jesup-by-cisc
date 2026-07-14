import { createFileRoute } from "@tanstack/react-router";
import { WeatherResourceCenter } from "@/components/home";
import { PageHeader, PublicLayout } from "@/components/public-layout";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/weather")({
  head: () =>
    listPageHead({
      title: "Weather & Emergency Center",
      description: "Local forecasts, alerts, county preparedness contacts, radar, and agricultural weather guidance.",
      path: "/weather",
    }),
  component: WeatherPage,
});

function WeatherPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Local readiness"
        title="Weather & Emergency"
        description="Forecasts, alerts, preparedness contacts, radar, and agricultural guidance for your location."
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <WeatherResourceCenter />
      </div>
    </PublicLayout>
  );
}
