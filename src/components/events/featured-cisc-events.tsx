import { CalendarDays, ExternalLink, MapPin } from "lucide-react";

const FEATURED_EVENTS = [
  {
    title: "30th Annual Booker T. Washington Economic Development Summit",
    date: "September 10–11, 2026",
    location: "Tuskegee University Campus · 1200 W. Montgomery Road, Tuskegee, AL 36088",
    description:
      "A legacy gathering focused on leadership, innovation, community empowerment, and economic ecosystems that promote development and prosperity.",
    image: "/events/booker-t-washington-summit-2026.jpg",
    imageAlt:
      "Save the date flyer for the 30th Annual Booker T. Washington Economic Development Summit",
    url: "https://www.tuskegee.edu/btwsummit",
    linkLabel: "Summit information",
  },
  {
    title: "84th Annual Professional Agricultural Workers Conference",
    date: "October 25–27, 2026",
    location: "Renaissance Montgomery Hotel & Spa · 201 Tallapoosa Street, Montgomery, AL",
    description:
      "Farmers, educators, researchers, students, and community leaders share knowledge and strengthen the land-grant mission through research, education, Extension, and networking.",
    image: "/events/pawc-2026.jpg",
    imageAlt: "Flyer for the 84th Annual Professional Agricultural Workers Conference",
    url: "https://pawc.info",
    linkLabel: "PAWC information",
  },
  {
    title: "Black Belt Meat Summit",
    date: "April 14–16, 2027",
    location: "Tuskegee University Campus · 1200 W. Montgomery Road, Tuskegee, AL 36088",
    description:
      "A two-day summit uniting farmers, processors, producers, researchers, and industry leaders to advance sustainable meat production and strengthen rural Black Belt economies.",
    image: "/events/black-belt-meat-summit-2027.jpg",
    imageAlt: "Save the date flyer for the Black Belt Meat Summit, April 14 through 16, 2027",
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
          Dates and locations are taken from the official event flyers supplied by CISC. Follow the
          event link for registration and schedule updates.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {FEATURED_EVENTS.map((event) => (
          <article
            key={event.title}
            className="flex overflow-hidden rounded-2xl border border-border/70 bg-card shadow-token-soft lg:flex-col"
          >
            <a
              href={event.image}
              target="_blank"
              rel="noreferrer"
              className="block w-2/5 shrink-0 bg-muted lg:aspect-[4/3] lg:w-full"
              aria-label={`Open full flyer: ${event.title}`}
            >
              <img
                src={event.image}
                alt={event.imageAlt}
                className="h-full w-full object-cover object-top"
                loading="lazy"
              />
            </a>
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
