import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container, Eyebrow, Lede } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import type { Package, Service } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/utils";

export function DraftBadge() {
  return (
    <span className="inline-block border border-bronze px-2 py-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-bronze-deep">
      Draft · not public
    </span>
  );
}

/** Duration and price rows for one service. */
export function PriceRows({ service, className }: { service: Service; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line border-y border-line", className)}>
      {service.variants.map((variant) => (
        <div key={variant.durationMin} className="flex items-baseline justify-between gap-6 py-4">
          <dt className="text-sm uppercase tracking-[0.18em] text-stone">{variant.durationMin} minutes</dt>
          <dd className="font-display text-3xl">{formatPrice(variant.priceCents)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full flex-col border border-line bg-ivory p-8 transition-colors duration-500 hover:border-bronze sm:p-10"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-[0.68rem] uppercase tracking-[0.26em] text-bronze-deep">
          {String(index + 1).padStart(2, "0")} · {service.category}
        </span>
        <ArrowUpRight
          aria-hidden
          className="size-5 text-bronze transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
          strokeWidth={1.25}
        />
      </div>
      <h3 className="mt-10 text-4xl leading-tight">{service.name}</h3>
      {service.status === "draft" ? (
        <div className="mt-4">
          <DraftBadge />
        </div>
      ) : null}
      <p className="mt-5 flex-1 leading-relaxed text-stone">{service.summary}</p>
      <p className="mt-10 border-t border-line pt-5 text-sm text-stone">
        {service.variants.map((v) => v.durationMin).join(" · ")} minutes
        <span className="mx-3 text-line">|</span>
        from <span className="text-charcoal">{formatPrice(Math.min(...service.variants.map((v) => v.priceCents)))}</span>
      </p>
    </Link>
  );
}

export function PackageCard({ pkg }: { pkg: Package }) {
  const perSession = Math.round(pkg.priceCents / pkg.sessionCount);
  return (
    <div className="flex h-full flex-col border border-line bg-ivory p-8">
      <p className="text-[0.68rem] uppercase tracking-[0.26em] text-bronze-deep">
        {pkg.sessionCount} × {pkg.durationMin} minutes
      </p>
      <h3 className="mt-6 text-3xl">{pkg.name}</h3>
      {pkg.status === "draft" ? (
        <div className="mt-3">
          <DraftBadge />
        </div>
      ) : null}
      <p className="mt-3 flex-1 text-stone">{pkg.summary}</p>
      <p className="mt-8 font-display text-4xl">{formatPrice(pkg.priceCents)}</p>
      <p className="mt-1 text-sm text-stone">{formatPrice(perSession)} per session</p>
    </div>
  );
}

interface CtaBandProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}

export function CtaBand({
  eyebrow = "By appointment",
  title,
  lede,
  primary = { href: "/book", label: "Book an appointment" },
  secondary,
}: CtaBandProps) {
  return (
    <section className="bg-charcoal text-ivory">
      <Container className="py-20 sm:py-28">
        <Reveal className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow onDark>{eyebrow}</Eyebrow>
            <h2 className="mt-7 max-w-2xl text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h2>
            {lede ? <Lede onDark className="mt-6">{lede}</Lede> : null}
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="bronze" size="lg">
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
            {secondary ? (
              <Button asChild variant="outline-light" size="lg">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
