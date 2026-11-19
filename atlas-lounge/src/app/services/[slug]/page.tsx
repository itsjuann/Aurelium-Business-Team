import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, DraftBadge, PriceRows } from "@/components/site/blocks";
import { Reveal } from "@/components/site/reveal";
import { Container, Eyebrow, RuleList, Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { catalogOptionsFromEnv, getService, getServices, isRequestable } from "@/lib/catalog";

type Props = PageProps<"/services/[slug]">;

export async function generateStaticParams() {
  return (await getServices()).map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService((await params).slug);
  if (!service) return {};
  return { title: service.name, description: service.summary };
}

// Unknown and draft slugs render the not-found page (noindex); draft content is never sent.
export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  const requestable = isRequestable(service, catalogOptionsFromEnv());

  return (
    <>
      <section className="bg-charcoal text-ivory">
        <Container className="grid gap-12 pb-20 pt-16 sm:pt-24 lg:grid-cols-12 lg:items-end lg:pb-28">
          <div className="animate-rise lg:col-span-7">
            <Eyebrow onDark>
              <Link href="/services" className="hover:text-ivory">
                Services
              </Link>
              <span aria-hidden>/</span> {service.category}
            </Eyebrow>
            <h1 className="mt-8 text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">{service.name}</h1>
            {service.status === "draft" ? (
              <div className="mt-6 [&_span]:text-bronze-light">
                <DraftBadge />
              </div>
            ) : null}
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist">{service.summary}</p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <dl className="divide-y divide-ivory/15 border-y border-ivory/15">
              {service.variants.map((variant) => (
                <div key={variant.durationMin} className="flex items-baseline justify-between py-4">
                  <dt className="text-sm uppercase tracking-[0.18em] text-mist">{variant.durationMin} minutes</dt>
                  <dd className="font-display text-3xl">{formatPrice(variant.priceCents)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8">
              {service.status === "draft" ? (
                <p className="text-sm text-mist">Draft services cannot be booked.</p>
              ) : (
                <Button asChild variant="bronze" size="lg" className="w-full">
                  <Link href={`/book?service=${service.slug}`}>
                    {requestable ? "Book now" : "Register to book"}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container className="grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>The session</Eyebrow>
            <p className="mt-8 font-display text-3xl leading-snug">{service.description}</p>
          </Reveal>
          <div className="space-y-14 lg:col-span-6 lg:col-start-7">
            <Reveal>
              <h2 className="text-3xl">What the session includes</h2>
              <RuleList items={service.includes} className="mt-6" />
            </Reveal>
            <Reveal>
              <h2 className="text-3xl">Who it is designed for</h2>
              <RuleList items={service.designedFor} className="mt-6" />
            </Reveal>
            <Reveal>
              <h2 className="text-3xl">What to expect</h2>
              <RuleList items={service.whatToExpect} className="mt-6" />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="ivory-deep" className="lg:py-28">
        <Container className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>Duration and price</Eyebrow>
            <PriceRows service={service} className="mt-8" />
            <p className="mt-5 text-sm leading-relaxed text-stone">
              Prices are per session. For mobile appointments, any travel fee is confirmed before you pay.
            </p>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7">
            <Eyebrow>Before you book</Eyebrow>
            <h2 className="mt-8 text-3xl">Precautions</h2>
            <RuleList items={service.precautions} className="mt-6" />
          </Reveal>
        </Container>
      </Section>

      {service.status === "draft" ? null : (
        <CtaBand
          title={`Book ${service.name.toLowerCase()}.`}
          primary={{ href: `/book?service=${service.slug}`, label: requestable ? "Book now" : "Register to book" }}
          secondary={{ href: "/faqs", label: "Read the FAQs" }}
        />
      )}
    </>
  );
}
