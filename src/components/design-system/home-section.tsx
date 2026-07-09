import type { ReactNode } from "react";
import { SectionHeader } from "./section-header";
import { SectionActionLink } from "./section-action-link";
import { cn } from "@/lib/utils";

export type HomeSectionMetaProps = {
  id: string;
  eyebrow?: string | null;
  title: string;
  viewAllRoute?: string | null;
  viewAllLabel?: string | null;
};

type HomeSectionProps = {
  sectionId: string;
  meta: HomeSectionMetaProps;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function HomeSection({
  sectionId,
  meta,
  action,
  children,
  className,
  titleClassName,
}: HomeSectionProps) {
  const headingId = `home-${sectionId}-heading`;
  const resolvedAction =
    action ??
    (meta.viewAllRoute && meta.viewAllLabel ? (
      <SectionActionLink to={meta.viewAllRoute}>{meta.viewAllLabel}</SectionActionLink>
    ) : undefined);

  return (
    <section aria-labelledby={headingId} className={cn(className)}>
      <SectionHeader
        titleId={headingId}
        eyebrow={meta.eyebrow ?? undefined}
        title={meta.title}
        action={resolvedAction}
        titleClassName={titleClassName}
      />
      {children}
    </section>
  );
}
