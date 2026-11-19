import { describe, expect, it } from "vitest";
import { bookingRequestSchema, contactSchema, waitlistSchema } from "@/lib/schemas";

const booking = {
  fullName: "Test Client",
  email: "Client@Example.com ",
  phone: "(555) 010-0000",
  serviceSlug: "massage",
  durationMin: "90",
  postalCode: "90210",
  preferredTimes: "Weekday evenings",
  acknowledgement: true,
};

describe("form schemas", () => {
  it("normalises a valid booking request", () => {
    const parsed = bookingRequestSchema.parse(booking);
    expect(parsed.email).toBe("client@example.com");
    expect(parsed.durationMin).toBe(90);
  });

  it("requires the not-a-confirmed-booking acknowledgement", () => {
    expect(bookingRequestSchema.safeParse({ ...booking, acknowledgement: false }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...booking, acknowledgement: undefined }).success).toBe(false);
  });

  it("rejects malformed contact details", () => {
    expect(bookingRequestSchema.safeParse({ ...booking, email: "nope" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...booking, phone: "call me" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...booking, postalCode: "<script>" }).success).toBe(false);
  });

  it("rejects submissions that fill the honeypot", () => {
    expect(waitlistSchema.safeParse({ email: "a@b.co", interest: "lounge", company: "Acme" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ email: "a@b.co", interest: "lounge", company: "" }).success).toBe(true);
  });

  it("only accepts known waitlist interests and contact topics", () => {
    expect(waitlistSchema.safeParse({ email: "a@b.co", interest: "cold-plunge-booking" }).success).toBe(false);
    expect(
      contactSchema.safeParse({ fullName: "A B", email: "a@b.co", topic: "Other", message: "Hello there, a question." })
        .success,
    ).toBe(false);
  });

  it("bounds message length", () => {
    const base = { fullName: "A B", email: "a@b.co", topic: "Memberships" as const };
    expect(contactSchema.safeParse({ ...base, message: "x".repeat(2001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...base, message: "A reasonable question." }).success).toBe(true);
  });
});
