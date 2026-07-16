import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    buildPageHead({
      title: "Terms of Use",
      description: "Terms governing use of the JESUP website and application.",
      path: "/terms",
    }),
  component: TermsPage,
});

const sections = [
  {
    title: "Using JESUP",
    body: "Use JESUP lawfully and provide accurate information when registering, applying, requesting services, or checking in. You are responsible for protecting your account credentials and for activity performed through your account. Notify CISC if you believe your account has been compromised.",
  },
  {
    title: "Registrations, applications, and availability",
    body: "Submitting a form does not guarantee admission, funding, equipment, accommodations, or a place at an event unless JESUP provides confirmation. Eligibility, capacity, deadlines, and program requirements may change. CISC may contact you for information needed to complete or review a request.",
  },
  {
    title: "Payments and external services",
    body: "JESUP does not directly process payment-card information. Paid event transactions may be completed through Eventbrite, and donations through Tuskegee University’s giving service. The provider’s terms, fees, refund rules, and privacy practices apply to those transactions. JESUP clearly identifies when a secure external service will open.",
  },
  {
    title: "Acceptable conduct",
    body: "Do not attempt to access another person’s records, bypass security controls, disrupt the service, upload malicious or unlawful material, impersonate another person, or use JESUP in a way that violates applicable law or University policy. Access may be limited or removed to protect participants and the platform.",
  },
  {
    title: "Content and availability",
    body: "Program information is provided for public service and may be updated without notice. JESUP may link to third-party resources; a link does not guarantee or endorse every statement on the external site. The service may occasionally be unavailable for maintenance, connectivity, emergencies, or circumstances outside CISC’s control.",
  },
  {
    title: "Accessibility and accommodations",
    body: "CISC aims to make JESUP usable by people with disabilities. Accessibility tools do not replace event-specific accommodation requests. Submit accommodation needs through the applicable registration form or contact CISC early enough for the team to coordinate support.",
  },
];

function TermsPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Legal and privacy"
        title="Terms of Use"
        description="The responsibilities and expectations that apply when using JESUP."
      />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-muted-foreground">Effective July 16, 2026</p>
        <p className="mt-5 leading-7 text-muted-foreground">
          By using JESUP, you agree to these terms. JESUP is operated by the Carver Integrative Sustainability Center in support of Tuskegee University Cooperative Extension programs.
        </p>
        <div className="mt-8 space-y-9">
          {sections.map((section) => (
            <section key={section.title} aria-labelledby={`terms-${section.title.toLowerCase().replaceAll(" ", "-")}`}>
              <h2
                id={`terms-${section.title.toLowerCase().replaceAll(" ", "-")}`}
                className="text-2xl font-black tracking-tight text-foreground"
              >
                {section.title}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
          <section aria-labelledby="terms-contact" className="rounded-3xl border bg-card p-6 sm:p-8">
            <h2 id="terms-contact" className="text-2xl font-black tracking-tight text-foreground">
              Contact
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Questions about JESUP may be sent to{" "}
              <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:cisc@tuskegee.edu">
                cisc@tuskegee.edu
              </a>
              . These terms may be updated as services and institutional requirements change.
            </p>
          </section>
        </div>
      </article>
    </PublicLayout>
  );
}
