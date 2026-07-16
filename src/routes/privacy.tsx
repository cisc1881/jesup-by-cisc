import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    buildPageHead({
      title: "Privacy Notice",
      description: "How JESUP collects, uses, protects, and shares information.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "Information we collect",
    body: "JESUP collects information you choose to provide when you create an account, register for an event, apply for a program or internship, request equipment, submit an inquiry, complete an evaluation, or request accommodations. This may include contact details, institutional affiliation, application materials, attendance records, dietary or allergy information, accessibility requests, and optional demographic information.",
  },
  {
    title: "How information is used",
    body: "Information is used to operate JESUP services, process registrations and applications, coordinate events and accommodations, communicate status updates, manage equipment, improve programs, meet reporting obligations, and protect the safety and integrity of the platform. Optional demographic responses are used for aggregate reporting only when consent is provided.",
  },
  {
    title: "Who can access information",
    body: "Authorized CISC and Tuskegee University program personnel may access records needed for their assigned work. JESUP uses service providers for secure hosting, authentication, email delivery, and event processing. Paid Eventbrite registrations and Tuskegee University donations are processed on those providers’ systems and are also subject to their privacy practices. JESUP does not sell personal information.",
  },
  {
    title: "Security and retention",
    body: "JESUP uses access controls, encrypted connections, role-based permissions, and database row-level security. No system can guarantee absolute security. Records are kept only as long as needed for program operations, legal or grant requirements, institutional records practices, and legitimate reporting needs.",
  },
  {
    title: "Your choices",
    body: "You may decline optional demographic questions and optional marketing updates. Required operational messages may still be sent for registrations, applications, safety notices, or requests you submit. You may contact CISC to ask about correcting your information or closing your JESUP account, subject to institutional retention requirements.",
  },
  {
    title: "Children and youth programs",
    body: "Some JESUP programs serve youth. Program-specific eligibility, guardian permission, and additional consent requirements apply where required. Do not submit sensitive information for a minor unless the applicable program instructions and permissions have been completed.",
  },
];

function PrivacyPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Legal and privacy"
        title="Privacy Notice"
        description="A plain-language summary of how information is handled through JESUP."
      />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-muted-foreground">Effective July 16, 2026</p>
        <div className="mt-8 space-y-9">
          {sections.map((section) => (
            <section key={section.title} aria-labelledby={`privacy-${section.title.toLowerCase().replaceAll(" ", "-")}`}>
              <h2
                id={`privacy-${section.title.toLowerCase().replaceAll(" ", "-")}`}
                className="text-2xl font-black tracking-tight text-foreground"
              >
                {section.title}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
          <section aria-labelledby="privacy-contact" className="rounded-3xl border bg-card p-6 sm:p-8">
            <h2 id="privacy-contact" className="text-2xl font-black tracking-tight text-foreground">
              Questions or requests
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Contact the Carver Integrative Sustainability Center at{" "}
              <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:cisc@tuskegee.edu">
                cisc@tuskegee.edu
              </a>
              . Privacy requests may require identity verification before records are disclosed or changed.
            </p>
          </section>
        </div>
      </article>
    </PublicLayout>
  );
}
