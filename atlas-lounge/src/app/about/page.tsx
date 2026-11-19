import type { Metadata } from "next";
import Link from "next/link";
import { ArchPlate, StrataPlate } from "@/components/site/art";
import { CtaBand } from "@/components/site/blocks";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, PageHero, Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "The Atlas Lounge is a private recovery practice today and a members' wellness lounge in development.",
};

const commitments = [
  {
    title: "Your time is protected",
    body: "Appointments are private and paced to you. We leave room around every session so it never feels hurried.",
  },
  {
    title: "Credentials come first",
    body: "A service that requires a professional licence only opens for booking once the practitioner's credentials have been verified.",
  },
  {
    title: "Plain language",
    body: "We describe what a session is, what it costs, and what it is not. Our services are for general wellness and are not medical treatment.",
  },
  {
    title: "Your information stays private",
    body: "Intake and consent details are collected privately and seen only by the people who need them to care for you.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={
          <>
            A practice first.
            <br />
            <em className="font-light text-bronze-light">A place, in time.</em>
          </>
        }
        lede="The Atlas Lounge begins as a private, appointment-based recovery practice, and is growing toward a physical lounge for recovery, movement, and quiet company."
        art={<ArchPlate />}
      />

      <Section>
        <Container className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow>Where we are</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight sm:text-5xl">Today</h2>
          </Reveal>
          <Reveal className="space-y-6 text-lg leading-relaxed text-stone lg:col-span-7 lg:col-start-6">
            <p className="font-display text-3xl leading-snug text-charcoal">
              We are launching quietly, with a small menu of private sessions delivered by appointment.
            </p>
            <p>
              Starting small is deliberate. It lets us give each appointment proper attention, learn what our
              guests value, and build the standards we want the lounge to be known for before it has walls.
            </p>
            <p>
              Sessions are currently mobile: your practitioner comes to you. Each request is confirmed
              personally, so you always know who is coming, when, and what it will cost.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section tone="ivory-deep">
        <Container className="grid gap-14 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-5">
            <div className="aspect-[4/3] overflow-hidden border border-line">
              <StrataPlate />
            </div>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7">
            <Eyebrow>Where we are going</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight sm:text-5xl">Tomorrow</h2>
            <p className="mt-7 text-lg leading-relaxed text-stone">
              The long-term vision is a wellness retreat and members&rsquo; lounge: treatment rooms, a cold
              plunge, space to move, and somewhere comfortable to sit afterwards. It is in development, with no
              opening date announced, and nothing on this site should be read as available until we say so.
            </p>
            <div className="mt-9">
              <Button asChild variant="link">
                <Link href="/future-lounge">Read about the future lounge</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <Eyebrow>What we hold ourselves to</Eyebrow>
            <h2 className="mt-8 max-w-2xl text-4xl leading-tight sm:text-5xl">Standards, not slogans.</h2>
          </Reveal>
          <div className="mt-16 grid gap-x-14 gap-y-12 md:grid-cols-2">
            {commitments.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 120} className="border-t border-line pt-8">
                <h3 className="text-3xl">{item.title}</h3>
                <p className="mt-4 max-w-md leading-relaxed text-stone">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand title="Begin with a single session." secondary={{ href: "/services", label: "Explore services" }} />
    </>
  );
}
