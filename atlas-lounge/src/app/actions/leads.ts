"use server";

import { z } from "zod";
import { getRequestableServices } from "@/lib/catalog";
import { saveLead, type SaveResult } from "@/lib/leads";
import { bookingRequestSchema, contactSchema, waitlistSchema } from "@/lib/schemas";
import { site } from "@/lib/site";

export type ActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function invalid(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
}

function failure(result: Exclude<SaveResult, { ok: true }>): ActionResult {
  const fallback = site.contactEmail ? ` Please email ${site.contactEmail} instead.` : "";
  switch (result.reason) {
    case "rate_limited":
      return {
        status: "error",
        message: "Too many attempts from this connection. Please try again in a few minutes.",
      };
    case "not_configured":
      return {
        status: "error",
        message: `This form is not connected yet, so your details were not sent.${fallback}`,
      };
    default:
      return {
        status: "error",
        message: `Something went wrong and your details were not sent.${fallback}`,
      };
  }
}

// A filled honeypot means a bot: respond as if accepted, store nothing.
const quietSuccess: ActionResult = { status: "success", message: "Thank you." };

export async function joinWaitlist(input: unknown): Promise<ActionResult> {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.some((i) => i.path[0] === "company") ? quietSuccess : invalid(parsed.error);
  }
  const { email, fullName, interest } = parsed.data;
  const result = await saveLead(
    "waitlist_entries",
    { email, full_name: fullName || null, interest, source: "website" },
    { ignoreDuplicates: true },
  );
  if (!result.ok) return failure(result);
  return { status: "success", message: "You are on the list. We will be in touch as plans take shape." };
}

export async function submitContact(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.some((i) => i.path[0] === "company") ? quietSuccess : invalid(parsed.error);
  }
  const { fullName, email, phone, topic, message } = parsed.data;
  const result = await saveLead("contact_messages", {
    full_name: fullName,
    email,
    phone: phone || null,
    topic,
    message,
  });
  if (!result.ok) return failure(result);
  return { status: "success", message: "Thank you. Your message has been received and we will reply personally." };
}

export async function requestAppointment(input: unknown): Promise<ActionResult> {
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.some((i) => i.path[0] === "company") ? quietSuccess : invalid(parsed.error);
  }
  const data = parsed.data;

  // Never trust the client: the service must be open for requests and the duration must exist.
  const service = (await getRequestableServices()).find((s) => s.slug === data.serviceSlug);
  const variant = service?.variants.find((v) => v.durationMin === data.durationMin);
  if (!service || !variant) {
    return {
      status: "error",
      message: "That service is not open for requests right now.",
      fieldErrors: { serviceSlug: "Please choose an available service." },
    };
  }

  const result = await saveLead("booking_requests", {
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    service_slug: service.slug,
    duration_min: variant.durationMin,
    postal_code: data.postalCode.toUpperCase(),
    preferred_times: data.preferredTimes,
    notes: data.notes || null,
  });
  if (!result.ok) return failure(result);
  return {
    status: "success",
    message:
      "Thank you. Your request has been received. We will contact you to confirm a time; your appointment is not booked until we do.",
  };
}
