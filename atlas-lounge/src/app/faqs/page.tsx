import type { Metadata } from "next";
import { CtaBand } from "@/components/site/blocks";
import { Container, Eyebrow, PageHero, Section } from "@/components/site/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers to common questions about booking, sessions, payment, and the future lounge.",
};

export default function FaqsPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title="Questions, answered plainly."
        lede="If you cannot find what you need, write to us and we will reply personally."
      />
      <Section>
        <Container className="space-y-20">
          {faqs.map((group) => (
            <div key={group.group} className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Eyebrow>{group.group}</Eyebrow>
              </div>
              <Accordion type="multiple" className="border-t border-line lg:col-span-8">
                {group.items.map((item) => (
                  <AccordionItem key={item.q} value={item.q}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </Container>
      </Section>
      <CtaBand
        eyebrow="Still wondering"
        title="Ask us anything."
        primary={{ href: "/contact", label: "Contact us" }}
        secondary={{ href: "/book", label: "Book an appointment" }}
      />
    </>
  );
}
