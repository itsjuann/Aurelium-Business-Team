import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[82rem] px-6 sm:px-10 lg:px-14", className)} {...props} />;
}

type SectionTone = "ivory" | "ivory-deep" | "charcoal" | "forest";

const sectionTones: Record<SectionTone, string> = {
  ivory: "bg-ivory text-charcoal",
  "ivory-deep": "bg-ivory-deep text-charcoal",
  charcoal: "bg-charcoal text-ivory",
  forest: "bg-forest text-ivory",
};

export function Section({
  tone = "ivory",
  className,
  ...props
}: React.ComponentProps<"section"> & { tone?: SectionTone }) {
  return <section className={cn("py-20 sm:py-28 lg:py-36", sectionTones[tone], className)} {...props} />;
}

/** Small spaced-caps label. `onDark` switches to the lighter bronze for contrast. */
export function Eyebrow({
  onDark = false,
  className,
  ...props
}: React.ComponentProps<"p"> & { onDark?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-4 text-[0.7rem] font-medium uppercase tracking-[0.26em]",
        onDark ? "text-bronze-light" : "text-bronze-deep",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="h-px w-10 bg-current opacity-60" />
      {props.children}
    </p>
  );
}

export function Lede({ onDark = false, className, ...props }: React.ComponentProps<"p"> & { onDark?: boolean }) {
  return (
    <p
      className={cn("max-w-xl text-lg leading-relaxed", onDark ? "text-mist" : "text-stone", className)}
      {...props}
    />
  );
}

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  art?: React.ReactNode;
}

/** Dark opening band used on every interior page. */
export function PageHero({ eyebrow, title, lede, children, art }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-charcoal text-ivory">
      <Container className="grid gap-12 pb-20 pt-16 sm:pb-24 sm:pt-24 lg:grid-cols-12 lg:items-end lg:pb-28">
        <div className={cn("animate-rise", art ? "lg:col-span-7" : "lg:col-span-9")}>
          <Eyebrow onDark>{eyebrow}</Eyebrow>
          <h1 className="mt-8 text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">{title}</h1>
          {lede ? <Lede onDark className="mt-8">{lede}</Lede> : null}
          {children ? <div className="mt-10 flex flex-wrap gap-4">{children}</div> : null}
        </div>
        {art ? (
          <div className="hidden lg:col-span-4 lg:col-start-9 lg:block">
            <div className="aspect-[4/5] overflow-hidden">{art}</div>
          </div>
        ) : null}
      </Container>
      <div aria-hidden className="h-px w-full bg-bronze/30" />
    </section>
  );
}

/** Bulleted list with bronze hairline markers. */
export function RuleList({ items, onDark = false, className }: { items: readonly string[]; onDark?: boolean; className?: string }) {
  return (
    <ul className={cn("space-y-4", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-4 leading-relaxed">
          <span aria-hidden className={cn("mt-[0.8em] h-px w-5 shrink-0", onDark ? "bg-bronze-light" : "bg-bronze")} />
          <span className={onDark ? "text-mist" : "text-stone"}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
