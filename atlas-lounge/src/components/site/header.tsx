"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { AtlasMark } from "@/components/site/art";
import { Button } from "@/components/ui/button";
import { primaryNav } from "@/lib/site";
import { cn } from "@/lib/utils";

function Wordmark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-3 text-ivory" aria-label="The Atlas Lounge, home">
      <AtlasMark className="text-bronze-light" />
      <span className="text-[0.78rem] font-medium uppercase tracking-[0.32em]">The Atlas Lounge</span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-ivory/10 bg-charcoal/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 w-full max-w-[82rem] items-center justify-between px-6 sm:px-10 lg:px-14">
        <Wordmark />

        <nav aria-label="Primary" className="hidden xl:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[0.72rem] uppercase tracking-[0.2em] text-ivory/75 transition-colors hover:text-ivory",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-bronze-light after:transition-transform after:duration-300 hover:after:scale-x-100",
                    isActive(item.href) && "text-ivory after:scale-x-100",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/login"
            className="hidden text-[0.72rem] uppercase tracking-[0.2em] text-ivory/75 transition-colors hover:text-ivory md:block"
          >
            Client Login
          </Link>
          <Button asChild variant="bronze" size="sm" className="hidden sm:inline-flex">
            <Link href="/book">Book</Link>
          </Button>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              className="-mr-2 flex size-11 items-center justify-center text-ivory xl:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-6" strokeWidth={1.25} />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-charcoal text-ivory data-[state=open]:animate-rise"
              >
                <div className="flex h-18 shrink-0 items-center justify-between border-b border-ivory/10 px-6 sm:px-10">
                  <Wordmark onNavigate={close} />
                  <Dialog.Close className="-mr-2 flex size-11 items-center justify-center" aria-label="Close menu">
                    <X className="size-6" strokeWidth={1.25} />
                  </Dialog.Close>
                </div>
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <nav aria-label="Mobile" className="flex-1 px-6 py-8 sm:px-10">
                  <ul>
                    {[...primaryNav, { href: "/faqs", label: "FAQs" }, { href: "/contact", label: "Contact" }].map(
                      (item, index) => (
                        <li key={item.href} className="border-b border-ivory/10">
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className="flex items-baseline gap-5 py-4 font-display text-3xl aria-[current=page]:text-bronze-light"
                          >
                            <span className="w-6 font-sans text-[0.65rem] tracking-[0.2em] text-bronze-light">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            {item.label}
                          </Link>
                        </li>
                      ),
                    )}
                  </ul>
                </nav>
                <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-ivory/10 px-6 py-6 sm:px-10">
                  <Button asChild variant="outline-light">
                    <Link href="/login" onClick={close}>
                      Client Login
                    </Link>
                  </Button>
                  <Button asChild variant="bronze">
                    <Link href="/book" onClick={close}>
                      Book
                    </Link>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
