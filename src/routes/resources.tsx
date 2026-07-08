import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { BookOpen, DollarSign, Briefcase, Package, ClipboardList, MapPin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources · JESUP" },
      { name: "description", content: "Publications, grants, internships, equipment, surveys, and farmers markets — everything in one place." },
      { property: "og:title", content: "Resources · JESUP" },
      { property: "og:description", content: "Every CISC resource, one tap away." },
    ],
  }),
  component: Resources,
});

const cards = [
  { to: "/publications", icon: BookOpen, title: "Publications", body: "Research briefs, community guides, and reports." },
  { to: "/grants", icon: DollarSign, title: "Grant opportunities", body: "Funding for community and farm projects." },
  { to: "/internships", icon: Briefcase, title: "Internships", body: "Apply for hands-on student and community internships." },
  { to: "/equipment", icon: Package, title: "Equipment checkout", body: "Reserve tools and equipment for your project." },
  { to: "/surveys", icon: ClipboardList, title: "Surveys", body: "Share your voice and shape our programs." },
  { to: "/markets", icon: MapPin, title: "Farmers markets", body: "Find local markets across Alabama." },
] as const;

function Resources() {
  return (
    <PublicLayout>
      <PageHeader eyebrow="One tap away" title="Resources" description="Everything CISC offers — organized, searchable, and ready when you are." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.to} to={c.to} className="group flex items-start gap-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl grad-crimson text-white">
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black tracking-tight text-foreground">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              </div>
              <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
