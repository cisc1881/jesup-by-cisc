import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarDays, Sprout, Store } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { AppButton, PageContainer } from "@/components/design-system";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => {
    const head = buildPageHead({
      title: "About JESUP · From the Jesup Wagon to Digital Extension",
      description: "Discover the Tuskegee Jesup Wagon's extension legacy and how JESUP connects people with programs, publications, markets, and events today.",
      path: "/about",
    });
    return { ...head, meta: head.meta.filter((meta) => !meta.property?.startsWith("og:image") && meta.name !== "twitter:image") };
  },
  component: AboutJesupPage,
});

const destinations = [
  { icon: CalendarDays, title: "Events", description: "Explore published events, including the 135th Annual Farmers Conference.", to: "/events" },
  { icon: Sprout, title: "Programs", description: "Discover extension programs and research initiatives.", to: "/programs" },
  { icon: BookOpen, title: "Publications", description: "Read practical knowledge and resources from the network.", to: "/publications" },
  { icon: Store, title: "Markets", description: "Connect with local markets and their communities.", to: "/markets" },
] as const;

function AboutJesupPage() {
  return (
    <PublicLayout>
      <div className="jesup-about">
        <header className="home-network-hero text-home-foreground">
          <PageContainer size="lg" className="py-12 sm:py-16">
            <p className="text-sm font-semibold text-home-muted">About JESUP</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">The Digital Extension Wagon</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-home-muted">Carrying the spirit of extension forward: connecting people with knowledge, programs, and opportunity wherever they are.</p>
          </PageContainer>
        </header>

        <section className="border-b border-border">
          <PageContainer size="lg" className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Our inspiration</p>
              <h2 className="mt-3 text-3xl font-semibold">The original Jesup Wagon</h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              <p>The historic Jesup Wagon was a mobile agricultural teaching wagon associated with Tuskegee Institute, now Tuskegee University. It brought practical demonstrations and agricultural knowledge to farmers and communities, beyond the campus.</p>
              <p>Its legacy is a simple idea: education should reach people where they live and work. JESUP takes inspiration from that approach. The Digital Extension Wagon is a contemporary digital platform, not a recreation of the historic wagon.</p>
            </div>
          </PageContainer>
        </section>

        <section>
          <PageContainer size="lg" className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <h2 className="text-3xl font-semibold">Extension, connected</h2>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              <p>JESUP brings events, programs, publications, and markets into a shared digital home for extension communities and the 1890 Land-Grant network.</p>
              <p>Explore information from a phone or computer and find connections to the people and institutions behind it. Digital access supports the human relationships at the heart of extension—it does not replace them.</p>
            </div>
          </PageContainer>
        </section>

        <section aria-label="Explore JESUP" className="border-y border-border bg-secondary/40">
          <PageContainer size="lg" className="grid sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map(({ icon: Icon, title, description, to }) => (
              <article key={to} className="flex flex-col items-start border-b border-border px-2 py-8 sm:px-5 lg:border-b-0">
                <Icon className="size-7 text-accent" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                <p className="mb-5 mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                <AppButton asChild variant="ghost" shape="square" className="mt-auto px-0"><Link to={to}>Explore {title.toLowerCase()} <ArrowRight /></Link></AppButton>
              </article>
            ))}
          </PageContainer>
        </section>
        <PageContainer size="lg" className="flex flex-col items-start gap-5 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm text-muted-foreground">Featured conference</p><h2 className="mt-2 text-2xl font-semibold">135th Annual Farmers Conference</h2></div>
          <AppButton asChild variant="secondary" shape="square"><Link to="/events/$id" params={{ id: "fc135" }}>Explore FC135 <ArrowRight /></Link></AppButton>
        </PageContainer>
      </div>
    </PublicLayout>
  );
}
