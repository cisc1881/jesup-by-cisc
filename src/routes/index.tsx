import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { MapPin, Calendar, BookOpen, DollarSign, Briefcase, Package, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

const quickLinks = [
  { to: "/markets", label: "Farmers Markets", icon: MapPin, desc: "Find local markets across Alabama" },
  { to: "/events", label: "Events & Workshops", icon: Calendar, desc: "Upcoming programs and learning opportunities" },
  { to: "/publications", label: "Publications", icon: BookOpen, desc: "Research briefs and community guides" },
  { to: "/grants", label: "Grant Opportunities", icon: DollarSign, desc: "Funding for community projects" },
  { to: "/internships", label: "Internships", icon: Briefcase, desc: "Student and community internships" },
  { to: "/equipment", label: "Equipment Checkout", icon: Package, desc: "Reserve tools for your project" },
  { to: "/surveys", label: "Surveys", icon: ClipboardList, desc: "Help shape our programs" },
];

function Landing() {
  const { data: events } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events")
        .select("id,title,starts_at,location,image_url")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true }).limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <span className="mb-4 inline-block h-1 w-16 rounded-full bg-accent" />
          <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Connecting communities to sustainable opportunity.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85">
            The Center for Integrated and Sustainable Communities at Tuskegee University supports farmers, families, and future leaders across the Black Belt and beyond.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/events">Browse Events</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/markets">Find a Market</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <span className="gold-bar mb-3" />
            <h2 className="font-serif text-2xl font-bold text-primary">Our Mission</h2>
          </div>
          <p className="text-lg leading-relaxed text-foreground/80 md:col-span-2">
            CISC advances integrated, community-driven approaches to sustainable food systems, economic opportunity, and workforce development — grounded in Tuskegee's legacy of service to underserved communities.
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8">
            <span className="gold-bar mb-3" />
            <h2 className="font-serif text-2xl font-bold text-primary">Explore CISC Connect</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((l) => (
              <Link key={l.to} to={l.to}>
                <Card className="h-full border-transparent transition hover:border-accent hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><l.icon className="h-5 w-5" /></div>
                    <h3 className="mt-4 font-serif text-lg font-semibold text-primary">{l.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{l.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="gold-bar mb-3" />
            <h2 className="font-serif text-2xl font-bold text-primary">Upcoming Events</h2>
          </div>
          <Button asChild variant="outline"><Link to="/events">View all</Link></Button>
        </div>
        {events && events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {events.map((e) => (
              <Link key={e.id} to="/events/$id" params={{ id: e.id }}>
                <Card className="h-full overflow-hidden transition hover:shadow-md">
                  {e.image_url ? (
                    <div className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url(${e.image_url})` }} />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-primary/80 to-primary" />
                  )}
                  <CardContent className="p-5">
                    <div className="text-xs font-medium uppercase tracking-wider text-accent">{fmtDateTime(e.starts_at)}</div>
                    <h3 className="mt-2 font-serif text-lg font-semibold text-primary">{e.title}</h3>
                    {e.location && <p className="mt-1 text-sm text-muted-foreground">{e.location}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No upcoming events yet. Check back soon.</CardContent></Card>
        )}
      </section>
    </PublicLayout>
  );
}
