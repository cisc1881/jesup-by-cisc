import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  ProgramCard,
  ProgramContactCard,
  ProgramContentSections,
  ProgramDetailHero,
} from "@/components/programs";
import { fetchProgramBySlug, fetchPrograms } from "@/lib/programs";

export const Route = createFileRoute("/programs/$slug")({
  loader: async ({ params }) => {
    const program = await fetchProgramBySlug(params.slug);
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Program not found · JESUP" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.program;
    return {
      meta: [
        { title: `${p.name} · JESUP` },
        { name: "description", content: p.tagline ?? p.name },
        { property: "og:title", content: `${p.name} · JESUP` },
        { property: "og:description", content: p.tagline ?? p.name },
        ...(p.coverImageUrl ? [{ property: "og:image", content: p.coverImageUrl }] : []),
      ],
    };
  },
  component: ProgramDetail,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black tracking-tight">Program not found</h1>
        <Link to="/programs" className="mt-6 inline-flex rounded-full grad-crimson px-5 py-2.5 text-sm font-bold text-white">
          Back to programs
        </Link>
      </div>
    </PublicLayout>
  ),
});

function ProgramDetail() {
  const { program } = Route.useLoaderData();
  const { data: allPrograms } = useQuery({
    queryKey: ["programs"],
    queryFn: () => fetchPrograms(),
  });
  const related = (allPrograms ?? []).filter((p) => p.slug !== program.slug).slice(0, 3);

  return (
    <PublicLayout>
      <ProgramDetailHero program={program} />

      <PageContainer size="md" className="pb-bottom-nav md:pb-[var(--page-py)]">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
          <ProgramContentSections program={program} />
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <ProgramContactCard program={program} />
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border/60 pt-10">
            <h2 className="mb-5 text-2xl font-black tracking-tight">More programs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProgramCard key={p.id} program={p} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </PageContainer>
    </PublicLayout>
  );
}
