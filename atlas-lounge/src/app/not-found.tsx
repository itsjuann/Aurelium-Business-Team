import Link from "next/link";
import { Container, Eyebrow } from "@/components/site/section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="bg-charcoal text-ivory">
      <Container className="flex min-h-[70vh] flex-col justify-center py-24">
        <Eyebrow onDark>Page not found</Eyebrow>
        <h1 className="mt-8 max-w-2xl text-5xl leading-tight sm:text-7xl">This page has wandered off the map.</h1>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild variant="bronze" size="lg">
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="outline-light" size="lg">
            <Link href="/services">Explore services</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
