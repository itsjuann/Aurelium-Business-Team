import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow, PageHero, RuleList, Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Client Login",
  description: "Client accounts for The Atlas Lounge.",
  robots: { index: false },
};

const planned = [
  "Book, reschedule, and review your appointments",
  "Complete intake and consent forms privately",
  "View receipts, packages, and remaining sessions",
  "Choose how we contact you",
];

export default function LoginPage() {
  return (
    <>
      <PageHero
        eyebrow="Client Login"
        title="Client accounts are on their way."
        lede="Online accounts are not open yet, so there is nothing to sign in to today. Until they are, we arrange every appointment with you directly."
      >
        <Button asChild variant="bronze" size="lg">
          <Link href="/book">Book an appointment</Link>
        </Button>
        <Button asChild variant="outline-light" size="lg">
          <Link href="/contact">Contact us</Link>
        </Button>
      </PageHero>
      <Section>
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow>Coming with accounts</Eyebrow>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <RuleList items={planned} />
          </div>
        </Container>
      </Section>
    </>
  );
}
