import type { Metadata } from "next";
import { MeridianPlate, StrataPlate } from "@/components/site/art";
import { CtaBand } from "@/components/site/blocks";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, Lede, PageHero, Section } from "@/components/site/section";
import { plannedAmenities } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Future Lounge",
  description:
    "The Atlas Lounge is planning a physical wellness lounge. See what is planned and join the waitlist for early access.",
};

export default function FutureLoungePage() {
  return (
    <>
      <PageHero
        eyebrow="The Future Lounge · In development"
        title={
          <>
            A place to recover,
            <br />
            <em className="font-light text-bronze-light">in good company.</em>
          </>
        }
        lede="We are planning a physical home for The Atlas Lounge. It is not open, no date or location has been announced, and nothing described here can be booked today."
        art={<MeridianPlate tone="dark" />}
      />

      <Section>
        <Container className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>The idea</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight sm:text-5xl">Somewhere between a treatment room and a club.</h2>
          </Reveal>
          <Reveal className="space-y-6 text-lg leading-relaxed text-stone lg:col-span-6 lg:col-start-7">
            <p>
              The lounge we are planning is a calm, architectural space where recovery is the reason to arrive
              and the atmosphere is the reason to stay: a session, a plunge, a stretch, and then a comfortable
              chair and nowhere to be.
            </p>
            <p>
              Plans change as they become real. We will share details here as they are confirmed, and those on
              the waitlist will hear first.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section tone="ivory-deep">
        <Container>
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Planned amenities</Eyebrow>
              <h2 className="mt-8 text-4xl leading-tight sm:text-5xl">What we are planning</h2>
            </div>
            <p className="border border-bronze px-4 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-bronze-deep">
              Planned · not yet available
            </p>
          </Reveal>
          <ul className="mt-16 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {plannedAmenities.map((amenity, i) => (
              <Reveal key={amenity.name} delay={(i % 3) * 90} className="bg-ivory-deep">
                <li className="flex h-full list-none flex-col bg-ivory p-8 sm:p-10">
                  <span className="text-[0.68rem] uppercase tracking-[0.26em] text-bronze-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-8 text-3xl">{amenity.name}</h3>
                  <p className="mt-4 leading-relaxed text-stone">{amenity.detail}</p>
                </li>
              </Reveal>
            ))}
            <li aria-hidden className="hidden list-none overflow-hidden lg:col-span-2 lg:block">
              <StrataPlate className="h-full min-h-56" />
            </li>
          </ul>
        </Container>
      </Section>

      <Section tone="forest" id="waitlist">
        <Container className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-6">
            <Eyebrow onDark>Waitlist</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight sm:text-5xl lg:text-6xl">Early access begins here.</h2>
            <Lede onDark className="mt-6">
              Join the waitlist to hear about the lounge before anyone else: progress, opening plans, and
              founding invitations. Joining is free and carries no obligation.
            </Lede>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5 lg:col-start-8">
            <WaitlistForm interest="lounge" onDark cta="Join the waitlist" idPrefix="lounge" />
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Available today"
        title="Until the doors open, we come to you."
        secondary={{ href: "/mobile-sessions", label: "Private mobile sessions" }}
      />
    </>
  );
}
