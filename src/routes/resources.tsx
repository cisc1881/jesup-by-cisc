import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { ArrowRight } from "lucide-react";
import { resourceHubLinks } from "@/lib/navigation";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/resources")({
  head: () => listPageHead({ title: "Resources", description: "Publications, farmers markets, grants, equipment, surveys, partners, donations, podcasts, and more.", path: "/resources" }),
  component: Resources,
});

function Resources() {
  return (
    <PublicLayout>
      <PageHeader eyebrow="One tap away" title="Resources" description="Everything CISC offers — organized, searchable, and ready when you are." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resourceHubLinks.map((c) => (
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
