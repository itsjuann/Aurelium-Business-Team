import type { Metadata } from "next";
import { MeridianPlate } from "@/components/site/art";
import { CtaBand } from "@/components/site/blocks";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, Lede, PageHero, Section } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Memberships",
  description: "Membership at The Atlas Lounge is in development. Join the list for early details.",
};

const intentions = [
  {
    title: "Recovery as a rhythm",
    body: "Membership is being designed around regular recovery rather than the occasional treat.",
  },
  {
    title: "A place to return to",
    body: "Members are intended to have access to the future lounge and the experiences planned within it.",
  },
  {
    title: "Kept deliberately small",
    body: "We plan to limit membership so the lounge stays calm and every member is known.",
  },
];

export default function MembershipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Memberships · In development"
        title="Membership, in the making."
        lede="Membership is not available yet. Tiers, pricing, and benefits are still being shaped, and none are on sale. What follows is our intent, not an offer."
        art={<MeridianPlate tone="dark" />}
      />

      <Section>
        <Container>
          <Reveal>
            <Eyebrow>What we are designing</Eyebrow>
          </Reveal>
          <div className="mt-14 grid gap-12 md:grid-cols-3">
            {intentions.map((item, i) => (
              <Reveal key={item.title} delay={i * 120} className="border-t border-bronze pt-8">
                <h2 className="text-3xl">{item.title}</h2>
                <p className="mt-4 leading-relaxed text-stone">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="forest">
        <Container className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-6">
            <Eyebrow onDark>Early access</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight sm:text-5xl">Hear about membership first.</h2>
            <Lede onDark className="mt-6">
              Join the list and we will share membership details with you before they are announced publicly.
              Joining carries no commitment and no charge.
            </Lede>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5 lg:col-start-8">
            <WaitlistForm interest="memberships" onDark idPrefix="memberships" />
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Available today"
        title="Private sessions, by appointment."
        secondary={{ href: "/services", label: "Explore services" }}
      />
    </>
  );
}
