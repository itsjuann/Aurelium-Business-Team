import Link from "next/link";
import { AtlasMark } from "@/components/site/art";
import { Container } from "@/components/site/section";
import { footerNav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <AtlasMark className="text-bronze-light" />
              <span className="text-[0.78rem] font-medium uppercase tracking-[0.32em]">The Atlas Lounge</span>
            </div>
            <p className="mt-6 max-w-sm font-display text-2xl leading-snug text-ivory/90">
              Private recovery, by appointment. A members&rsquo; lounge in the making.
            </p>
            <ul className="mt-8 space-y-2 text-sm text-mist">
              {site.serviceArea ? <li>Serving {site.serviceArea}</li> : null}
              {site.contactEmail ? (
                <li>
                  <a className="hover:text-ivory" href={`mailto:${site.contactEmail}`}>
                    {site.contactEmail}
                  </a>
                </li>
              ) : null}
              {site.contactPhone ? (
                <li>
                  <a className="hover:text-ivory" href={`tel:${site.contactPhone.replace(/[^+\d]/g, "")}`}>
                    {site.contactPhone}
                  </a>
                </li>
              ) : null}
              {site.instagramUrl ? (
                <li>
                  <a className="hover:text-ivory" href={site.instagramUrl} rel="noreferrer" target="_blank">
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            {footerNav.map((group) => (
              <div key={group.heading}>
                <h2 className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.26em] text-bronze-light">
                  {group.heading}
                </h2>
                <ul className="mt-5 space-y-3 text-sm text-ivory/80">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link className="transition-colors hover:text-ivory" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ivory/10 pt-8 text-xs leading-relaxed text-mist sm:flex-row sm:justify-between">
          <p>&copy; The Atlas Lounge. All rights reserved.</p>
          <p className="max-w-xl sm:text-right">
            Our services are for general wellness and relaxation. They are not medical treatment and do not
            diagnose, treat, or cure any condition.
          </p>
        </div>
      </Container>
    </footer>
  );
}
