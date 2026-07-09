export function NewsPageHero() {
  return (
    <section className="border-b border-border/60 bg-card">
      <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">JESUP · CISC</p>
        <h1 className="mt-3 text-4xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-5xl">
          News & Stories
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Stay informed about CISC programs, research, Extension activities, student success, and community impact.
        </p>
      </div>
    </section>
  );
}
