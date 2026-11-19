import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, DraftBadge, PackageCard, PriceRows } from "@/components/site/blocks";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, PageHero, RuleList, Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { getPackages, getServices } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Pricing & Packages",
  description: "Clear, per-session pricing for private recovery sessions with The Atlas Lounge.",
};

const notes = [
  "Prices are per session, per person.",
  "For mobile appointments, any travel fee depends on your location and is confirmed before you pay.",
  "Cancellation and rescheduling terms are confirmed in writing with your appointment.",
];

export default async function PricingPage() {
  const [services, packages] = await Promise.all([getServices(), getPackages()]);
  return (
    <>
      <PageHero
        eyebrow="Pricing & Packages"
        title="Clear prices. No surprises."
        lede="What you see is what a session costs. Anything that depends on your location is confirmed before you commit."
      />

      <Section>
        <Container>
          <Reveal>
            <Eyebrow>Single sessions</Eyebrow>
          </Reveal>
          <div className="mt-12 space-y-16">
            {services.map((service) => (
              <Reveal key={service.slug} className="grid gap-8 border-t border-charcoal pt-10 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <h2 className="text-4xl sm:text-5xl">{service.name}</h2>
                  {service.status === "draft" ? (
                    <div className="mt-4">
                      <DraftBadge />
                    </div>
                  ) : null}
                  <p className="mt-5 max-w-sm leading-relaxed text-stone">{service.summary}</p>
                  <div className="mt-7">
                    <Button asChild variant="link">
                      <Link href={`/services/${service.slug}`}>Session details</Link>
                    </Button>
                  </div>
                </div>
                <PriceRows service={service} className="self-start lg:col-span-6 lg:col-start-7" />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="ivory-deep">
        <Container>
          <Reveal>
            <Eyebrow>Packages</Eyebrow>
            <h2 className="mt-8 max-w-2xl text-4xl leading-tight sm:text-5xl">Session packages</h2>
          </Reveal>
          {packages.length > 0 ? (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {packages.map((pkg, i) => (
                <Reveal key={pkg.slug} delay={(i % 4) * 90}>
                  <PackageCard pkg={pkg} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-10 grid gap-12 lg:grid-cols-12">
              <p className="text-lg leading-relaxed text-stone lg:col-span-5">
                Multi-session packages are being finalised and are not yet available to purchase. Leave your
                email and we will let you know when they are.
              </p>
              <div className="lg:col-span-6 lg:col-start-7">
                <WaitlistForm interest="services" cta="Notify me" idPrefix="packages" />
              </div>
            </Reveal>
          )}
        </Container>
      </Section>

      <Section className="lg:py-28">
        <Container className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow>Good to know</Eyebrow>
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6">
            <RuleList items={notes} />
          </Reveal>
        </Container>
      </Section>

      <CtaBand title="Choose your session." secondary={{ href: "/faqs", label: "Read the FAQs" }} />
    </>
  );
}
