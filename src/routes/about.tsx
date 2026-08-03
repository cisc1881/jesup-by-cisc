import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, MapPinned, Radio, Users, Van, Wifi } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    buildPageHead({
      title: "About JESUP · The Digital Extension Wagon",
      description:
        "Learn how JESUP carries extension, research, events, and trusted resources into one connected digital experience for the 1890 Land-Grant network.",
      path: "/about",
    }),
  component: AboutJesupPage,
});

const capabilities = [
  [
    CalendarCheck,
    "Events that work",
    "Registration, personalized agendas, QR check-in, session attendance, meal tickets, messaging, and post-event reporting.",
  ],
  [
    Users,
    "A connected 1890 network",
    "Institution-aware programs, workshops, opportunities, and conferences with one consistent JESUP experience.",
  ],
  [
    MapPinned,
    "Extension where people are",
    "Local weather, emergency information, markets, publications, grants, and community resources in one place.",
  ],
  [
    Wifi,
    "Built for the field",
    "A mobile-first progressive web app designed for phones, campuses, conferences, community sites, and low-connectivity settings.",
  ],
] as const;

function AboutJesupPage() {
  return (
    <PublicLayout>
      <main>
        <section className="relative overflow-hidden bg-[var(--gradient-jesup)] text-white">
          <div
            className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:52px_52px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/75">
                About JESUP
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">
                The Digital Extension Wagon
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85">
                A new and innovative way to carry the land-grant mission forward—connecting people
                to knowledge, programs, researchers, institutions, and each other wherever they are.
              </p>
            </div>
            <Van
              className="hidden h-44 w-44 justify-self-center text-white lg:block"
              strokeWidth={1.1}
              aria-hidden="true"
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <Radio className="h-10 w-10 text-primary" />
              <h2 className="mt-5 text-3xl font-black tracking-tight">
                From a wagon of knowledge to a digital network
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              <p>
                Extension has always been about meeting people where they are. The original
                extension wagon carried practical demonstrations, university expertise, and new
                ideas directly into communities.
              </p>
              <p>
                JESUP reimagines that mission for today. The Digital Extension Wagon brings trusted
                information and services to a phone or computer while strengthening the human
                connections that make extension work.
              </p>
              <p>
                It is more than an event app. JESUP is a shared platform for the 1890 Land-Grant
                system—supporting conferences, programs, workshops, internships, community
                resources, impact reporting, and year-round engagement.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(([Icon, title, body]) => (
              <article key={title} className="border-b p-6 sm:border-r lg:border-b-0 lg:p-8">
                <Icon className="h-8 w-8 text-primary" />
                <h2 className="mt-5 text-lg font-black">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="bg-slate-900 px-6 py-12 text-white sm:px-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">
              Move the mission forward
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              Discover what the Digital Extension Wagon can connect you to today.
            </h2>
            <Link
              to="/programs"
              className="mt-8 inline-flex min-h-12 items-center gap-2 bg-white px-6 font-extrabold text-slate-900"
            >
              Explore programs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
