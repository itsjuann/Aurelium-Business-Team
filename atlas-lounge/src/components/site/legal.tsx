import * as React from "react";
import { Container, PageHero, Section } from "@/components/site/section";
import { site } from "@/lib/site";

export interface LegalSection {
  heading: string;
  body: readonly (string | readonly string[])[];
}

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: readonly LegalSection[] }) {
  return (
    <>
      <PageHero eyebrow={`Last updated ${site.legalLastUpdated}`} title={title} lede={intro} />
      <Section>
        <Container className="max-w-3xl">
          {site.legalReviewed ? null : (
            <p role="note" className="mb-14 border border-bronze bg-bronze/5 px-5 py-4 text-sm leading-relaxed text-charcoal">
              <strong className="font-medium">Draft pending legal review.</strong> This document is a working
              draft and has not yet been reviewed by legal counsel. It will be finalised before online booking
              and payment open.
            </p>
          )}
          <div className="space-y-14">
            {sections.map((section, i) => (
              <section key={section.heading}>
                <h2 className="text-3xl">
                  <span className="mr-4 font-sans text-xs tracking-[0.2em] text-bronze-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.heading}
                </h2>
                <div className="mt-5 space-y-4 leading-relaxed text-stone">
                  {section.body.map((block, j) =>
                    typeof block === "string" ? (
                      <p key={j}>{block}</p>
                    ) : (
                      <ul key={j} className="list-disc space-y-2 pl-5 marker:text-bronze">
                        {block.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}

export function contactLine(): string {
  return site.contactEmail
    ? `You can reach us at ${site.contactEmail} or through the contact page.`
    : "You can reach us through the contact page.";
}
