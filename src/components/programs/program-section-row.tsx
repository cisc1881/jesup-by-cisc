import type { ProgramListItem } from "@/lib/programs";
import { HorizontalScroll, HorizontalScrollItem, SectionHeader } from "@/components/design-system";
import { ProgramCard } from "@/components/programs/program-card";

type ProgramSectionRowProps = {
  title: string;
  programs: ProgramListItem[];
  sectionId?: string;
  /** Stagger base index for carousel card animations */
  animationOffset?: number;
};

export function ProgramSectionRow({
  title,
  programs,
  sectionId,
  animationOffset = 0,
}: ProgramSectionRowProps) {
  if (programs.length === 0) return null;

  const headingId = sectionId ?? `programs-section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="space-y-5 animate-fade-up">
      <SectionHeader title={title} titleId={headingId} />
      <div className="gold-divider" />
      <HorizontalScroll gap="md">
        {programs.map((program, index) => (
          <HorizontalScrollItem key={program.id} width="md">
            <ProgramCard
              program={program}
              variant="rich"
              animationIndex={animationOffset + index}
              className="w-[78vw] sm:w-64"
            />
          </HorizontalScrollItem>
        ))}
      </HorizontalScroll>
    </section>
  );
}
