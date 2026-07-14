import type { EventReportPreview } from "@/lib/event-reporting";
import {
  DEMOGRAPHIC_CATEGORY_LABELS,
  formatDemographicLabel,
  groupDemographicAggregates,
} from "@/lib/demographics";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { JesupLogoMark } from "@/components/branding";
import { galleryImageAlt } from "@/lib/event-gallery";
import { Badge } from "@/components/ui/badge";

type EventReportPreviewProps = {
  report: EventReportPreview;
  showAdminNote?: boolean;
};

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`report-section break-inside-avoid-page ${className ?? ""}`}>
      <h2 className="report-section-title mb-3 font-serif text-xl font-bold text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EventReportPreviewPanel({ report, showAdminNote = true }: EventReportPreviewProps) {
  const { narrativeFields: n } = report;
  const demographicGroups = groupDemographicAggregates(report.demographics.rows);

  return (
    <div
      id="event-report-print-root"
      className="event-report-preview space-y-8 rounded-2xl bg-card p-6 shadow-token-soft print:rounded-none print:shadow-none print:p-0"
    >
      <header className="report-cover border-b border-primary/20 pb-6 text-center">
        <JesupLogoMark
          size="md"
          tone="on-light"
          className="mb-3"
          imageClassName="h-12 max-w-[12rem]"
        />
        <h1 className="mt-2 font-serif text-3xl font-black text-primary">
          {n.reportTitle || "Event Report"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tuskegee University Cooperative Extension · Carver Integrative Sustainability Center
        </p>
        {n.preparedBy && (
          <p className="mt-1 text-sm text-muted-foreground">Prepared by {n.preparedBy}</p>
        )}
        {n.reportDate && (
          <p className="text-sm text-muted-foreground">Report date: {fmtDate(n.reportDate)}</p>
        )}
        {report.isFrozenSnapshot && <Badge className="mt-3 print:hidden">Finalized snapshot</Badge>}
      </header>

      {showAdminNote && report.isMultiEvent && (
        <p className="rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground print:hidden">
          {report.attendance.uniqueParticipantNote}
        </p>
      )}

      <Section title="Event overview">
        {report.events.map((event) => (
          <div key={event.id} className="mb-4 rounded-lg border p-4">
            <h3 className="font-semibold text-foreground">{event.title}</h3>
            <p className="text-sm text-muted-foreground">
              {fmtDateTime(event.startsAt)}
              {event.endsAt ? ` – ${fmtDateTime(event.endsAt)}` : ""}
            </p>
            {event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
            {event.categoryName && (
              <p className="text-sm text-muted-foreground">Category: {event.categoryName}</p>
            )}
          </div>
        ))}
        {n.eventPurpose && (
          <div className="mt-4">
            <h3 className="font-medium">Event purpose</h3>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{n.eventPurpose}</p>
          </div>
        )}
      </Section>

      <Section title="Program goals">
        <p className="whitespace-pre-wrap text-sm text-foreground/90">{n.programGoals || "—"}</p>
      </Section>

      <Section title="Event date, location, format, and audience">
        <MetricRow
          label="Delivery format"
          value={report.programsPartners.deliveryFormat ?? "Not specified"}
        />
        <MetricRow label="Event category" value={report.programsPartners.eventCategory ?? "—"} />
        <MetricRow label="Eligible participants" value={report.attendance.eligibleParticipants} />
        <MetricRow label="Counties served" value={report.geography.countiesServed} />
        <MetricRow label="States served" value={report.geography.statesServed} />
      </Section>

      <Section title="Attendance summary">
        <MetricRow label="Registrations" value={report.attendance.registrations} />
        <MetricRow label="Checked in" value={report.attendance.checkedIn} />
        <MetricRow label="Attended" value={report.attendance.attended} />
        <MetricRow label="Virtual" value={report.attendance.virtual} />
        <MetricRow label="Walk-ins" value={report.attendance.walkIns} />
        <MetricRow label="No-shows" value={report.attendance.noShows} />
        <MetricRow label="Cancelled" value={report.attendance.cancelled} />
        <MetricRow label="Attendance rate" value={`${report.attendance.attendanceRate}%`} />
      </Section>

      <Section title="Geographic reach">
        <p className="text-sm text-muted-foreground">
          Counties: {report.geography.counties.join(", ") || "—"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          States: {report.geography.states.join(", ") || "—"}
        </p>
      </Section>

      <Section title="Institution participation">
        <MetricRow
          label="Institutions represented"
          value={report.institutions.institutionsRepresented}
        />
        <MetricRow
          label="1890 institutions represented"
          value={report.institutions.landGrant1890Represented}
        />
      </Section>

      <Section title="Participant demographic aggregates">
        {report.demographics.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No demographic aggregates available.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {[...demographicGroups.entries()].map(([category, items]) => (
              <div key={category} className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">
                  {DEMOGRAPHIC_CATEGORY_LABELS[category] ?? category}
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((item) => (
                      <tr key={`${category}-${item.valueLabel}`}>
                        <td className="py-1 text-muted-foreground">
                          {formatDemographicLabel(category, item.valueLabel)}
                        </td>
                        <td className="py-1 text-right font-medium">
                          {item.suppressed ? "Fewer than 5" : item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Evaluation findings">
        <MetricRow label="Total responses" value={report.evaluation.totalResponses} />
        <MetricRow label="Completed responses" value={report.evaluation.completedResponses} />
        <MetricRow label="Response rate" value={`${report.evaluation.responseRate}%`} />
        <MetricRow
          label="Average overall rating"
          value={report.evaluation.averageOverallRating ?? "—"}
        />
        <MetricRow
          label="Average relevance rating"
          value={report.evaluation.averageRelevanceRating ?? "—"}
        />
        <MetricRow
          label="Average knowledge gained"
          value={report.evaluation.averageKnowledgeGainedRating ?? "—"}
        />
        <MetricRow
          label="Intended behavior change"
          value={report.evaluation.intendedBehaviorChangeRating ?? "—"}
        />
        <MetricRow
          label="Interest in future programs (Yes / Maybe / No)"
          value={`${report.evaluation.interestInFuturePrograms.yes} / ${report.evaluation.interestInFuturePrograms.maybe} / ${report.evaluation.interestInFuturePrograms.no}`}
        />
      </Section>

      <Section title="Outcomes and intended behavior change">
        <p className="whitespace-pre-wrap text-sm text-foreground/90">
          {n.outcomesImpactNotes || "—"}
        </p>
      </Section>

      <Section title="Programs and partners involved">
        <p className="text-sm">
          <span className="font-medium">Programs: </span>
          {report.programsPartners.programs.map((p) => p.name).join(", ") || "—"}
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium">Partners: </span>
          {report.programsPartners.partners.map((p) => p.name).join(", ") || "—"}
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium">Publications distributed: </span>
          {report.programsPartners.publications.map((p) => p.title).join(", ") || "—"}
        </p>
      </Section>

      <Section title="Selected participant comments">
        {n.selectedParticipantQuotes ? (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {n.selectedParticipantQuotes}
          </p>
        ) : report.evaluation.openTextSamples.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/90">
            {report.evaluation.openTextSamples.map((sample, index) => (
              <li key={index}>{sample}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No participant comments selected.</p>
        )}
      </Section>

      <Section title="Approved event gallery">
        <MetricRow label="Approved images" value={report.gallery.approvedImages} />
        <MetricRow label="Pending submissions" value={report.gallery.pendingSubmissions} />
        {report.gallery.approvedItems.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.gallery.approvedItems.slice(0, 6).map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-lg border">
                <img
                  src={item.imageUrl}
                  alt={galleryImageAlt(item)}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                {item.caption && (
                  <figcaption className="px-2 py-1 text-xs text-muted-foreground">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recommendations and follow-up">
        <h3 className="font-medium">Recommendations</h3>
        <p className="mb-4 whitespace-pre-wrap text-sm text-foreground/90">
          {n.recommendations || "—"}
        </p>
        <h3 className="font-medium">Follow-up actions</h3>
        <p className="whitespace-pre-wrap text-sm text-foreground/90">{n.followUpActions || "—"}</p>
        {n.additionalComments && (
          <>
            <h3 className="mt-4 font-medium">Additional comments</h3>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{n.additionalComments}</p>
          </>
        )}
      </Section>

      <footer className="report-footer border-t border-primary/20 pt-4 text-center text-xs text-muted-foreground">
        <p>
          JESUP · Carver Integrative Sustainability Center · Tuskegee University Cooperative
          Extension
        </p>
        <p className="mt-1">Generated {fmtDateTime(report.generatedAt)}</p>
      </footer>
    </div>
  );
}
