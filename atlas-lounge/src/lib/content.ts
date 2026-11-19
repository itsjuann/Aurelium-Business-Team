// Editorial content shared across pages. Kept free of claims the business has not confirmed.

export interface Testimonial {
  quote: string;
  author: string;
}

/**
 * Only real testimonials, approved by the business with the client's consent, belong here
 * (from Phase 6 they are managed in the admin dashboard). While empty, the testimonial
 * section is not rendered anywhere on the site.
 */
export const approvedTestimonials: Testimonial[] = [];

export const plannedAmenities = [
  {
    name: "Cold plunge",
    detail: "A dedicated plunge space designed for calm, unhurried contrast sessions.",
  },
  {
    name: "Recovery lounge",
    detail: "A quiet room to slow down before or after a session.",
  },
  {
    name: "Private treatment rooms",
    detail: "Considered, private rooms for massage and hands-on services.",
  },
  {
    name: "Mobility and stretching areas",
    detail: "Open floor space for guided and self-directed movement.",
  },
  {
    name: "Recovery technology",
    detail: "A curated selection of recovery equipment, chosen with care.",
  },
  {
    name: "Work and social spaces",
    detail: "Comfortable places to take a call, read, or meet a friend.",
  },
  {
    name: "Membership experiences",
    detail: "Access and programming shaped around members.",
  },
] as const;

export const faqs = [
  {
    group: "Appointments",
    items: [
      {
        q: "How do I book?",
        a: "Every session is by appointment. Choose a service and send us your preferred days and times; we confirm each appointment personally. Nothing is booked, and no payment is taken, until we confirm with you.",
      },
      {
        q: "Where do sessions take place?",
        a: "At present, sessions are private and mobile: your practitioner comes to you, within our service area. A permanent lounge is planned for the future, and is not yet open.",
      },
      {
        q: "Which services can I book today?",
        a: "The services shown on our Services page are the ones currently offered. Additional services are being finalised and will appear there once they are available.",
      },
      {
        q: "What if I need to cancel or reschedule?",
        a: "Please let us know as early as you can. The cancellation and rescheduling terms that apply to your appointment are confirmed in writing when we confirm your booking.",
      },
    ],
  },
  {
    group: "Your session",
    items: [
      {
        q: "What do I need to prepare for a mobile session?",
        a: "A quiet room with enough clear floor space for a treatment table and for your practitioner to move around it. We will confirm any details specific to your home or building beforehand.",
      },
      {
        q: "Are your services medical treatment?",
        a: "No. Our services are for general wellness and relaxation. They are not medical treatment and are not a substitute for care from a licensed healthcare provider. If you have a medical condition, injury, or are pregnant, please speak with your healthcare provider before booking.",
      },
      {
        q: "Who will be my practitioner?",
        a: "We verify a practitioner's credentials before any service that requires a professional licence can be booked with them. You will know who is coming before your appointment.",
      },
      {
        q: "Will you ask about my health?",
        a: "Before your first session we ask you to complete a short, private intake and consent form. That information is used only to deliver your session safely and is visible only to the people who need it.",
      },
    ],
  },
  {
    group: "Payment and membership",
    items: [
      {
        q: "How do I pay?",
        a: "Payment details are confirmed with your appointment. When online payment is offered, it is processed securely by our payment provider; we never store your card details.",
      },
      {
        q: "Do you offer packages?",
        a: "Session packages are being finalised. Any package that is available to purchase is listed on our Pricing page.",
      },
      {
        q: "Is membership available?",
        a: "Not yet. Membership is planned alongside the future lounge. Join the list and we will share details with you first.",
      },
      {
        q: "When does the lounge open?",
        a: "We have not announced an opening date or location. The lounge is in development, and the amenities described on this site are plans rather than current offerings.",
      },
    ],
  },
] as const;
