import { z } from "zod";

const name = z.string().trim().min(2, "Please enter your name.").max(120);
const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254);
const phone = z
  .string()
  .trim()
  .regex(/^[0-9+().\-\s]{7,20}$/, "Please enter a valid phone number.");
/** Hidden field real visitors leave empty; bots tend to fill it. */
const honeypot = z.string().max(0).optional();

export const waitlistInterests = ["lounge", "memberships", "booking", "services"] as const;

export const waitlistSchema = z.object({
  email,
  fullName: z.string().trim().max(120).optional(),
  interest: z.enum(waitlistInterests),
  company: honeypot,
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const contactTopics = [
  "Booking an appointment",
  "Services and pricing",
  "Memberships",
  "The Future Lounge",
  "Something else",
] as const;

export const contactSchema = z.object({
  fullName: name,
  email,
  phone: phone.optional().or(z.literal("")),
  topic: z.enum(contactTopics),
  message: z.string().trim().min(10, "Please tell us a little more.").max(2000),
  company: honeypot,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const bookingRequestSchema = z.object({
  fullName: name,
  email,
  phone,
  serviceSlug: z.string().trim().min(1, "Please choose a service."),
  durationMin: z.coerce.number().int().positive("Please choose a duration."),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9 \-]{2,9}$/, "Please enter a valid postal code."),
  preferredTimes: z
    .string()
    .trim()
    .min(5, "Please share a few days and times that suit you.")
    .max(500),
  notes: z.string().trim().max(1000).optional(),
  acknowledgement: z.literal(true, {
    error: "Please confirm you understand this is a request, not a confirmed booking.",
  }),
  company: honeypot,
});
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export type BookingRequestFormValues = z.input<typeof bookingRequestSchema>;
