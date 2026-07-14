import { CalendarDays, ExternalLink, MapPin } from "lucide-react";

const FEATURED_EVENTS = [
  {
    title: "30th Annual Booker T. Washington Economic Development Summit",
    date: "September 10–11, 2026",
    location: "Tuskegee University Campus · 1200 W. Montgomery Road, Tuskegee, AL 36088",
    description:
      "A legacy gathering focused on leadership, innovation, community empowerment, and economic ecosystems that promote development and prosperity.",
    image: "/starter/economic-development.jpg",
    imageAlt: "AI-generated illustration of rural economic development and entrepreneurship",
    url: "https://www.tuskegee.edu/btwsummit",
    linkLabel: "Summit information",
  },
  {
    title: "84th Annual Professional Agricultural Workers Conference",
    date: "October 25–27, 2026",
    location: "Renaissance Montgomery Hotel & Spa · 201 Tallapoosa Street, Montgomery, AL",
    description:
      "Farmers, educators, researchers, students, and community leaders share knowledge and strengthen the land-grant mission through research, education, Extension, and networking.",
    image: "/starter/agricultural-extension.jpg",
    imageAlt: "AI-generated illustration of agricultural education and Extension collaboration",
    url: "https://pawc.info",
    linkLabel: "PAWC information",
  },
  {
    title: "Black Belt Meat Summit",
    date: "April 14–16, 2027",
    location: "Tuskegee University Campus · 1200 W. Montgomery Road, Tuskegee, AL 36088",
    description:
      "A two-day summit uniting farmers, processors, producers, researchers, and industry leaders to advance sustainable meat production and strengthen rural Black Belt economies.",
    image: "/starter/sustainable-livestock.jpg",
    imageAlt: "AI-generated illustration of sustainable Black Belt livestock production",
    url: "https://www.tuskegee.edu/BlackBeltMeatSummit",
    linkLabel: "Meat Summit information",
    contact:
      "Dr. Clarissa Harris · charris2@tuskegee.edu | Dr. Derris Burnett · dburnett@tuskegee.edu",
  },
] as const;

export function FeaturedCiscEvents() {
  return (
    <section aria-labelledby="featured-cisc-events-title" className="space-y-5">
      <div>
        <p className="text-eyebrow grad-gold-text">Save the date</p>
        <h2
          id="featured-cisc-events-title"
          className="mt-1 text-2xl font-black tracking-tight sm:text-3xl"
        >
          Featured CISC and Tuskegee events
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Event details reflect official materials from CISC and Tuskegee University. Artwork is
          AI-generated and illustrative; follow each event link for registration and schedule
          updates.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {FEATURED_EVENTS.map((event) => (
          <article
            key={event.title}
            className="flex overflow-hidden rounded-2xl border border-border/70 bg-card shadow-token-soft lg:flex-col"
          >
            <div className="block w-2/5 shrink-0 bg-muted lg:aspect-[4/3] lg:w-full">
              <img
                src={event.image}
                alt={event.imageAlt}
                className="h-full w-full object-cover object-top"
                loading="lazy"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
              <h3 className="font-black leading-snug">{event.title}</h3>
              <p className="mt-3 flex gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {event.date}
              </p>
              <p className="mt-2 flex gap-2 text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {event.location}
              </p>
              <p className="mt-3 hidden text-sm leading-relaxed text-muted-foreground sm:block">
                {event.description}
              </p>
              {"contact" in event && (
                <p className="mt-3 hidden text-xs text-muted-foreground lg:block">
                  Contacts: {event.contact}
                </p>
              )}
              <a
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                {event.linkLabel}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
