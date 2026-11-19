// Brand and business details. Anything not yet confirmed by the business is read from the
// environment and simply omitted from the site when unset: nothing here is invented.

const env = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const site = {
  name: "The Atlas Lounge",
  tagline: "Private recovery, by appointment",
  description:
    "The Atlas Lounge is a private, appointment-based recovery practice offering massage sessions that come to you, with a members' wellness lounge in development.",
  url: env(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
  contactEmail: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  contactPhone: env(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  serviceArea: env(process.env.NEXT_PUBLIC_SERVICE_AREA),
  instagramUrl: env(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  /** Flip to true only once counsel has approved the Privacy Policy and Terms. */
  legalReviewed: process.env.NEXT_PUBLIC_LEGAL_REVIEWED === "true",
  legalLastUpdated: "November 19, 2026",
} as const;

export const primaryNav = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/mobile-sessions", label: "Mobile Sessions" },
  { href: "/memberships", label: "Memberships" },
  { href: "/future-lounge", label: "The Future Lounge" },
  { href: "/about", label: "About" },
] as const;

export const footerNav = [
  {
    heading: "Visit",
    links: [
      { href: "/services", label: "Services" },
      { href: "/pricing", label: "Pricing & Packages" },
      { href: "/book", label: "Book an Appointment" },
      { href: "/mobile-sessions", label: "Private Mobile Sessions" },
    ],
  },
  {
    heading: "The Lounge",
    links: [
      { href: "/about", label: "About" },
      { href: "/future-lounge", label: "The Future Lounge" },
      { href: "/memberships", label: "Memberships" },
      { href: "/faqs", label: "FAQs" },
    ],
  },
  {
    heading: "Clients",
    links: [
      { href: "/login", label: "Client Login" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;
