import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { WideDiscoveryCard } from "@/components/design-system/wide-discovery-card";
import { useHomeData } from "@/hooks/use-home-data";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import { readStoredWeatherLocation } from "@/lib/weather/location-storage";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/explore")({ component: ExplorePage });

const categories = [
  { label: "Events", to: "/events", image: "/images/content/fc135-conference-art.jpg" },
  { label: "Programs", to: "/programs", image: "/images/content/chfp.jpg" },
  {
    label: "Publications",
    to: "/publications",
    image: "/images/content/state-of-african-americans-black-belt.jpg",
  },
  { label: "Markets", to: "/markets", image: "/images/content/macon-county-farmers-market.jpg" },
  { label: "Podcasts", to: "/podcast", image: "/images/content/2fas-podcast.jpg" },
  { label: "Internships", to: "/internships", image: "/images/content/chfp-cohort.jpg" },
] as const;

function ExplorePage() {
  const navigate = useNavigate();
  const { data } = useHomeData();
  const { institutionId } = useInstitutionTheme();
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Your area");

  useEffect(() => {
    const updateLocation = () => {
      const location = readStoredWeatherLocation();
      setLocationLabel(
        location?.city && location?.state
          ? `${location.city}, ${location.state}`
          : (location?.label ?? "Your area"),
      );
    };
    updateLocation();
    window.addEventListener("jesup-weather-location-changed", updateLocation);
    return () => window.removeEventListener("jesup-weather-location-changed", updateLocation);
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setPlaceholderIndex((index) => (index + 1) % categories.length),
      2600,
    );
    return () => window.clearInterval(timer);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ to: "/search", search: query.trim() ? { q: query.trim() } : {} });
  }

  const now = Date.now();
  const upcoming = (data?.events ?? []).filter((event) => Date.parse(event.startsAt) >= now);
  const forYou = upcoming.filter(
    (event) => !institutionId || event.networkWide || event.institutionIds.includes(institutionId),
  );
  const localCity = locationLabel.split(",")[0].trim().toLowerCase();
  const nearMe =
    localCity === "your area"
      ? []
      : forYou.filter((event) => event.location?.toLowerCase().includes(localCity));
  const thisWeek = forYou.filter((event) => Date.parse(event.startsAt) <= now + 7 * 86400000);
  const eventRails = [
    { title: "For You", entries: forYou.slice(0, 6) },
    { title: `Near ${locationLabel}`, entries: nearMe.slice(0, 6) },
    { title: "This Week", entries: thisWeek.slice(0, 6) },
  ].filter((rail) => rail.entries.length > 0);

  return (
    <PublicLayout>
      <main className="mx-auto max-w-7xl space-y-11 px-4 pb-32 pt-7 sm:px-6 sm:pt-12">
        <div>
          <Link
            to="/weather"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" /> {locationLabel}{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Explore JESUP</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Discover what is happening across the 1890 Land-Grant network.
          </p>
          <form
            onSubmit={submitSearch}
            role="search"
            className="mt-6 flex max-w-3xl items-center gap-3 rounded-full border border-border bg-card p-2 shadow-[var(--shadow-soft)]"
          >
            <button
              type="submit"
              aria-label="Search JESUP"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <label htmlFor="explore-search" className="sr-only">
              Search JESUP
            </label>
            <input
              id="explore-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search for ${categories[placeholderIndex].label}`}
              className="min-w-0 flex-1 bg-transparent pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>

        <section aria-labelledby="explore-categories">
          <h2 id="explore-categories" className="mb-4 text-2xl font-black">
            Browse by category
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.to}
                to={category.to}
                search={category.to === "/events" ? { view: "explore" } : undefined}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#191919] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-3 bottom-3 text-base font-extrabold text-white sm:text-lg">
                  {category.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {eventRails.map((rail) => (
          <section key={rail.title} aria-label={rail.title}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">{rail.title}</h2>
              <Link
                to="/events"
                search={{ view: "explore" }}
                className="text-sm font-bold text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {rail.entries.map((event) => (
                <WideDiscoveryCard
                  key={event.id}
                  href={`/events/${encodeURIComponent(event.id)}`}
                  title={event.title}
                  imageUrl={event.imageUrl}
                  imageAlt={event.title}
                  eyebrow={fmtDateTime(event.startsAt)}
                  detail={event.location}
                  className="w-[82vw] max-w-[420px] shrink-0 snap-start sm:w-[42vw]"
                />
              ))}
            </div>
          </section>
        ))}
        {data && (
          <div className="grid gap-8 lg:grid-cols-2">
            {data.programs.length > 0 && (
              <section aria-label="Programs" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Programs</h2>
                  <Link to="/programs" className="text-sm font-bold text-primary">
                    View all
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.programs.slice(0, 2).map((program) => (
                    <WideDiscoveryCard
                      key={program.slug}
                      href={`/programs/${encodeURIComponent(program.slug)}`}
                      title={program.name}
                      imageUrl={program.imageUrl}
                      detail={program.short}
                    />
                  ))}
                </div>
              </section>
            )}
            {data.markets.length > 0 && (
              <section aria-label="Markets" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Markets</h2>
                  <Link to="/markets" className="text-sm font-bold text-primary">
                    View all
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.markets.slice(0, 2).map((market) => (
                    <WideDiscoveryCard
                      key={market.id}
                      href={`/markets/${encodeURIComponent(market.id)}`}
                      title={market.name}
                      imageUrl={market.coverImageUrl}
                      detail={[market.city, market.state].filter(Boolean).join(", ")}
                    />
                  ))}
                </div>
              </section>
            )}
            {data.publications.length > 0 && (
              <section aria-label="Publications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Publications</h2>
                  <Link to="/publications" className="text-sm font-bold text-primary">
                    View all
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.publications.slice(0, 2).map((publication) => (
                    <WideDiscoveryCard
                      key={publication.id}
                      href={`/publications/${encodeURIComponent(publication.slug)}`}
                      title={publication.title}
                      imageUrl={publication.coverImageUrl}
                      detail={publication.description}
                    />
                  ))}
                </div>
              </section>
            )}
            {data.featuredPodcast && (
              <section aria-label="Podcasts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Podcasts</h2>
                  <Link to="/podcast" className="text-sm font-bold text-primary">
                    View all
                  </Link>
                </div>
                <WideDiscoveryCard
                  href={`/podcasts/${encodeURIComponent(data.featuredPodcast.slug)}`}
                  title={data.featuredPodcast.title}
                  imageUrl={data.featuredPodcast.coverUrl}
                  detail={data.featuredPodcast.description}
                />
              </section>
            )}
          </div>
        )}
      </main>
    </PublicLayout>
  );
}
