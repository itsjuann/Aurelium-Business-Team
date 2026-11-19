import type { Metadata } from "next";
import { ArchPlate } from "@/components/site/art";
import { CtaBand } from "@/components/site/blocks";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, PageHero, RuleList, Section } from "@/components/site/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Private Mobile Sessions",
  description: "Private recovery sessions delivered to you by appointment.",
};

const steps = [
  {
    title: "Request",
    body: "Choose your service and duration, and share where and when you would like your session.",
  },
  {
    title: "Confirm",
    body: "We confirm that we travel to your location, your appointment time, your practitioner, and any travel fee.",
  },
  {
    title: "Prepare",
    body: "Complete a short private intake and consent form, and set aside a quiet room.",
  },
  {
    title: "Receive",
    body: "Your practitioner arrives, sets up, and the time is yours.",
  },
];

const space = [
  "A quiet, private room at a comfortable temperature",
  "Clear floor space for a treatment table, with room to walk around it",
  "Somewhere nearby for your practitioner to wash their hands",
  "Pets settled in another room, where possible",
];

const standards = [
  "Sessions are strictly professional, and you remain appropriately draped throughout.",
  "You may pause or end a session at any time, and so may your practitioner.",
  "Another adult is welcome to be at home during your appointment.",
  "We confirm who is coming before every appointment.",
];

export default function MobileSessionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Private Mobile Sessions"
        title="The lounge comes to you."
        lede={
          site.serviceArea
            ? `Private, appointment-based sessions delivered to you across ${site.serviceArea}.`
            : "Private, appointment-based sessions delivered to you within our service area."
        }
        art={<ArchPlate />}
      />

      <Section>
        <Container>
          <Reveal>
            <Eyebrow>How a mobile session works</Eyebrow>
          </Reveal>
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 100}>
                <li className="list-none border-t border-line pt-8">
                  <span className="font-display text-5xl text-bronze">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="mt-6 text-3xl">{step.title}</h2>
                  <p className="mt-4 leading-relaxed text-stone">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="ivory-deep">
        <Container className="grid gap-16 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Your space</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight">What we ask of the room</h2>
            <RuleList items={space} className="mt-8" />
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>Our standards</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight">Safety and professionalism</h2>
            <RuleList items={standards} className="mt-8" />
          </Reveal>
        </Container>
      </Section>

      <Section className="lg:py-28">
        <Container className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>Travel</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight">Service area and travel fees</h2>
          </Reveal>
          <Reveal className="space-y-5 text-lg leading-relaxed text-stone lg:col-span-6 lg:col-start-7">
            <p>
              We travel within a defined service area. When you request an appointment, we use your postal code
              to confirm that we can reach you.
            </p>
            <p>
              Where a travel fee applies, it is based on your location and is always confirmed before you pay.
              There are no charges added afterwards.
            </p>
          </Reveal>
        </Container>
      </Section>

      <CtaBand title="Make room for an hour." secondary={{ href: "/faqs", label: "Read the FAQs" }} />
    </>
  );
}
