import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { Container, Eyebrow, PageHero, Section } from "@/components/site/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with The Atlas Lounge.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Write to us."
        lede="Questions about a session, a booking, or the future lounge. Every message is read and answered personally."
      />
      <Section>
        <Container className="grid gap-16 lg:grid-cols-12">
          <aside className="space-y-10 lg:col-span-4">
            {site.contactEmail || site.contactPhone ? (
              <div>
                <Eyebrow>Directly</Eyebrow>
                <ul className="mt-6 space-y-2 font-display text-2xl">
                  {site.contactEmail ? (
                    <li>
                      <a className="hover:text-bronze-deep" href={`mailto:${site.contactEmail}`}>
                        {site.contactEmail}
                      </a>
                    </li>
                  ) : null}
                  {site.contactPhone ? (
                    <li>
                      <a className="hover:text-bronze-deep" href={`tel:${site.contactPhone.replace(/[^+\d]/g, "")}`}>
                        {site.contactPhone}
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            <div>
              <Eyebrow>Appointments</Eyebrow>
              <p className="mt-6 leading-relaxed text-stone">
                To arrange a session, the quickest route is the{" "}
                <Link className="text-charcoal underline decoration-bronze underline-offset-4" href="/book">
                  booking page
                </Link>
                .
              </p>
            </div>
            <div>
              <Eyebrow>Sessions</Eyebrow>
              <p className="mt-6 leading-relaxed text-stone">
                By appointment only{site.serviceArea ? `, serving ${site.serviceArea}` : ""}. We do not currently
                have premises open to visitors.
              </p>
            </div>
          </aside>
          <div className="lg:col-span-7 lg:col-start-6">
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
