import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Headphones,
  MapPin,
  Store,
  Users,
} from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";

export const Route = createFileRoute("/explore")({ component: ExplorePage });

const areas = [
  {
    label: "Events & workshops",
    description: "Conferences, field days, and learning sessions",
    to: "/events",
    icon: CalendarDays,
  },
  {
    label: "Programs",
    description: "Extension initiatives and opportunities",
    to: "/programs",
    icon: GraduationCap,
  },
  {
    label: "Publications",
    description: "Research and practical guidance",
    to: "/publications",
    icon: BookOpen,
  },
  {
    label: "Markets",
    description: "Discover local food and farm markets",
    to: "/markets",
    icon: Store,
  },
  {
    label: "Podcasts",
    description: "Conversations from the network",
    to: "/podcast",
    icon: Headphones,
  },
  {
    label: "Internships",
    description: "Career and learning opportunities",
    to: "/internships",
    icon: BriefcaseBusiness,
  },
  {
    label: "Partners",
    description: "Organizations moving knowledge forward",
    to: "/partners",
    icon: Users,
  },
  {
    label: "Weather & preparedness",
    description: "Local conditions and county guidance",
    to: "/weather",
    icon: MapPin,
  },
] as const;

function ExplorePage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Knowledge in Motion"
        title="Explore Jesup"
        description="Find the people, programs, research, and opportunities across the Digital Extension Wagon."
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 pb-28 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {areas.map(({ label, description, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            search={to === "/events" ? { view: "explore" } : undefined}
            className="group min-h-44 rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-black">{label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </PublicLayout>
  );
}
