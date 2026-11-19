import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingRequestForm, type RequestableService } from "@/components/forms/booking-request-form";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Container, Eyebrow, PageHero, RuleList, Section } from "@/components/site/section";
import { getRequestableServices } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Request a private, appointment-based session with The Atlas Lounge.",
};

type Props = PageProps<"/book">;

const expectations = [
  "Send your preferred service, days, and times.",
  "We reply personally to confirm a time, your practitioner, and any travel fee.",
  "Your appointment is booked only once we have confirmed it with you.",
  "Before your first session, you complete a short private intake and consent form.",
];

async function PreselectedForm({
  services,
  searchParams,
}: {
  services: RequestableService[];
  searchParams: Props["searchParams"];
}) {
  const { service } = await searchParams;
  return (
    <BookingRequestForm services={services} initialServiceSlug={typeof service === "string" ? service : undefined} />
  );
}

export default async function BookPage({ searchParams }: Props) {
  const services: RequestableService[] = (await getRequestableServices()).map((service) => ({
    slug: service.slug,
    name: service.name,
    variants: service.variants.map(({ durationMin, priceCents }) => ({ durationMin, priceCents })),
  }));
  const open = services.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Book an Appointment"
        title={open ? "Request your session." : "Booking opens soon."}
        lede={
          open
            ? "Every appointment is confirmed personally. Tell us what you would like and when, and we will be in touch."
            : "We are completing practitioner credentialing before we accept appointments. Leave your email and you will be the first to know when booking opens."
        }
      />
      <Section>
        <Container className="grid gap-16 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <Eyebrow>How it works</Eyebrow>
            <RuleList items={open ? expectations : expectations.slice(1)} className="mt-8" />
            <p className="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-stone">
              Our services are for general wellness and are not medical treatment. If you have a medical
              condition, injury, or are pregnant, please speak with your healthcare provider before booking.
            </p>
          </aside>
          <div className="lg:col-span-7 lg:col-start-6">
            {open ? (
              <Suspense fallback={<BookingRequestForm services={services} />}>
                <PreselectedForm services={services} searchParams={searchParams} />
              </Suspense>
            ) : (
              <div>
                <h2 className="text-4xl leading-tight">Be first to book.</h2>
                <p className="mb-10 mt-5 max-w-lg leading-relaxed text-stone">
                  Services that require a professional licence only open for booking once the
                  practitioner&rsquo;s credentials have been verified. We will email you once, when appointments
                  are available.
                </p>
                <WaitlistForm interest="booking" cta="Notify me" idPrefix="booking" />
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
