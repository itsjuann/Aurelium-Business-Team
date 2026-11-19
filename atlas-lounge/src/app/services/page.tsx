import type { Metadata } from "next";
import { CtaBand, ServiceCard } from "@/components/site/blocks";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, PageHero, Section } from "@/components/site/section";
import { getServices } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Services",
  description: "Private, appointment-based recovery sessions from The Atlas Lounge.",
};

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="A short menu, done properly."
        lede="Every session is private, by appointment, and shaped around you. These are the services currently offered."
      />
      <Section>
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            {services.map((service, i) => (
              <Reveal key={service.slug} delay={(i % 2) * 120}>
                <ServiceCard service={service} index={i} />
              </Reveal>
            ))}
            <Reveal delay={120} className="flex flex-col justify-end border border-dashed border-line p-8 sm:p-10">
              <Eyebrow>More to come</Eyebrow>
              <p className="mt-6 font-display text-3xl leading-snug">
                Further services are being finalised.
              </p>
              <p className="mt-4 leading-relaxed text-stone">
                We add a service only once it is ready to be delivered to our standard. New sessions will be
                listed here when they are available to book.
              </p>
            </Reveal>
          </div>
          <p className="mt-14 max-w-2xl text-sm leading-relaxed text-stone">
            Our services are for general wellness and relaxation. They are not medical treatment and are not a
            substitute for care from a licensed healthcare provider.
          </p>
        </Container>
      </Section>
      <CtaBand title="Ready when you are." secondary={{ href: "/pricing", label: "See pricing" }} />
    </>
  );
}
