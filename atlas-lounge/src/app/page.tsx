import Link from "next/link";
import { ArchPlate, MeridianPlate } from "@/components/site/art";
import { CtaBand, PriceRows, ServiceCard } from "@/components/site/blocks";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, Lede, Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { getServices } from "@/lib/catalog";
import { approvedTestimonials, plannedAmenities } from "@/lib/content";

const principles = [
  {
    title: "Private",
    body: "One guest, one practitioner, one unhurried appointment. Nothing shared, nothing rushed.",
  },
  {
    title: "Considered",
    body: "Every session begins with a conversation and is shaped around how you feel that day.",
  },
  {
    title: "Honest",
    body: "Clear prices, plain language, and no promises a massage cannot keep.",
  },
];

const steps = [
  { title: "Request", body: "Choose a service and share the days and times that suit you." },
  { title: "Confirm", body: "We reply personally to confirm your time, practitioner, and any travel fee." },
  { title: "Receive", body: "Your practitioner arrives at your door. You simply make space and exhale." },
];

export default async function HomePage() {
  const services = await getServices();
  const [feature, ...rest] = services;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal text-ivory">
        <Container className="grid gap-14 pb-16 pt-14 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-24">
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="animate-rise">
              <Eyebrow onDark>Private recovery · By appointment</Eyebrow>
              <h1 className="mt-9 text-[3.4rem] leading-[0.98] sm:text-7xl lg:text-[6.2rem]">
                Recovery,
                <br />
                <em className="font-light text-bronze-light">considered.</em>
              </h1>
            </div>
            <div className="animate-rise [animation-delay:160ms]">
              <Lede onDark className="mt-9">
                The Atlas Lounge is a private recovery practice. Unhurried massage sessions, delivered to your
                door by appointment, and the first chapter of a members&rsquo; lounge in the making.
              </Lede>
              <div className="mt-11 flex flex-wrap gap-4">
                <Button asChild variant="bronze" size="lg">
                  <Link href="/book">Book an appointment</Link>
                </Button>
                <Button asChild variant="outline-light" size="lg">
                  <Link href="/services">Explore services</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] max-h-[38rem] w-full overflow-hidden animate-rise [animation-delay:240ms]">
              <ArchPlate animate />
            </div>
          </div>
        </Container>
        <div className="border-t border-ivory/10">
          <Container>
            <ul className="grid divide-y divide-ivory/10 text-[0.7rem] uppercase tracking-[0.24em] text-mist sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <li className="py-5 sm:pr-8">By appointment only</li>
              <li className="py-5 sm:px-8">Private mobile sessions</li>
              <li className="py-5 sm:pl-8">60 · 90 · 120 minute sessions</li>
            </ul>
          </Container>
        </div>
      </section>

      {/* Philosophy */}
      <Section>
        <Container className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>Our philosophy</Eyebrow>
            <h2 className="mt-8 text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Rest is not a reward. It is part of the work.
            </h2>
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <p className="font-display text-2xl leading-relaxed sm:text-3xl">
                We believe recovery deserves the same attention as everything it makes possible. So we built a
                practice around time, privacy, and care, and we are building a place to match.
              </p>
            </Reveal>
            <dl className="mt-14 grid gap-10 sm:grid-cols-3">
              {principles.map((item, i) => (
                <Reveal key={item.title} delay={i * 120}>
                  <dt className="border-t border-bronze pt-5 text-[0.7rem] uppercase tracking-[0.26em] text-bronze-deep">
                    {item.title}
                  </dt>
                  <dd className="mt-4 leading-relaxed text-stone">{item.body}</dd>
                </Reveal>
              ))}
            </dl>
            <Reveal className="mt-12">
              <Button asChild variant="link">
                <Link href="/about">About The Atlas Lounge</Link>
              </Button>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Services */}
      <Section tone="ivory-deep">
        <Container>
          <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Services</Eyebrow>
              <h2 className="mt-8 max-w-2xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
                A short menu, done properly.
              </h2>
            </div>
            <Button asChild variant="link">
              <Link href="/services">View all services</Link>
            </Button>
          </Reveal>

          {feature ? (
            <Reveal className="mt-16 grid border border-line bg-ivory lg:grid-cols-2">
              <div className="p-8 sm:p-12 lg:p-16">
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-bronze-deep">
                  01 · {feature.category}
                </p>
                <h3 className="mt-8 text-5xl leading-tight sm:text-6xl">{feature.name}</h3>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-stone">{feature.summary}</p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Button asChild>
                    <Link href={`/services/${feature.slug}`}>Session details</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/book?service=${feature.slug}`}>Book</Link>
                  </Button>
                </div>
              </div>
              <div className="border-t border-line p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-16">
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-stone">Session length</p>
                <PriceRows service={feature} className="mt-6" />
                <p className="mt-6 text-sm leading-relaxed text-stone">
                  Prices are per session. Any travel fee is confirmed before your appointment.
                </p>
              </div>
            </Reveal>
          ) : null}

          {rest.length > 0 ? (
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {rest.map((service, i) => (
                <Reveal key={service.slug} delay={(i % 2) * 120}>
                  <ServiceCard service={service} index={i + 1} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-8">
              <p className="max-w-xl text-sm leading-relaxed text-stone">
                We are opening with a deliberately focused menu. Further services are being finalised and will
                be listed here once they are available to book.
              </p>
            </Reveal>
          )}
        </Container>
      </Section>

      {/* How it works */}
      <Section>
        <Container>
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-8 max-w-2xl text-4xl leading-tight sm:text-5xl">We come to you.</h2>
          </Reveal>
          <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 120}>
                <li className="list-none border-t border-line pt-8">
                  <span className="font-display text-5xl text-bronze">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-6 text-3xl">{step.title}</h3>
                  <p className="mt-4 max-w-xs leading-relaxed text-stone">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-14">
            <Button asChild variant="link">
              <Link href="/mobile-sessions">About private mobile sessions</Link>
            </Button>
          </Reveal>
        </Container>
      </Section>

      {/* Testimonials: rendered only when real, approved testimonials exist */}
      {approvedTestimonials.length > 0 ? (
        <Section tone="ivory-deep">
          <Container>
            <Eyebrow>In their words</Eyebrow>
            <div className="mt-14 grid gap-12 md:grid-cols-2">
              {approvedTestimonials.map((t) => (
                <figure key={t.quote} className="border-t border-bronze pt-8">
                  <blockquote className="font-display text-3xl leading-snug">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 text-[0.7rem] uppercase tracking-[0.24em] text-stone">
                    {t.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Future lounge */}
      <Section tone="forest">
        <Container className="grid gap-14 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-5">
            <div className="aspect-square overflow-hidden">
              <MeridianPlate />
            </div>
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <Eyebrow onDark>In development</Eyebrow>
              <h2 className="mt-8 text-4xl leading-tight sm:text-5xl lg:text-6xl">The Future Lounge</h2>
              <Lede onDark className="mt-7">
                Our private practice is the beginning. We are planning a physical lounge: a place for recovery,
                movement, and quiet company. It is not open yet, and we would rather show you plans than make
                promises.
              </Lede>
            </Reveal>
            <Reveal delay={120}>
              <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-ivory/85">
                {plannedAmenities.slice(0, 6).map((amenity) => (
                  <li key={amenity.name} className="flex items-center gap-3 border-t border-ivory/15 pt-3">
                    {amenity.name}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-bronze-light">Planned · not yet available</p>
              <div className="mt-10">
                <Button asChild variant="outline-light" size="lg">
                  <Link href="/future-lounge">See the plans and join the waitlist</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <CtaBand
        title="Make time for recovery."
        lede="Tell us when suits you. We will take care of the rest."
        secondary={{ href: "/contact", label: "Ask a question" }}
      />
    </>
  );
}
