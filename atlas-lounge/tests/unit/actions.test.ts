import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveLead = vi.fn();
vi.mock("@/lib/leads", () => ({ saveLead: (...args: unknown[]) => saveLead(...args) }));

import { joinWaitlist, requestAppointment, submitContact } from "@/app/actions/leads";

const request = {
  fullName: "Test Client",
  email: "client@example.com",
  phone: "555 010 0000",
  serviceSlug: "massage",
  durationMin: 60,
  postalCode: "90210",
  preferredTimes: "Saturday morning",
  acknowledgement: true,
};

beforeEach(() => {
  saveLead.mockReset();
  saveLead.mockResolvedValue({ ok: true });
});
afterEach(() => vi.unstubAllEnvs());

describe("requestAppointment", () => {
  it("refuses a licence-gated service while credentials are unverified", async () => {
    const result = await requestAppointment(request);
    expect(result.status).toBe("error");
    expect(saveLead).not.toHaveBeenCalled();
  });

  it("stores the request once the service is open", async () => {
    vi.stubEnv("CREDENTIAL_VERIFIED_SERVICES", "massage");
    const result = await requestAppointment(request);
    expect(result.status).toBe("success");
    expect(saveLead).toHaveBeenCalledWith(
      "booking_requests",
      expect.objectContaining({ service_slug: "massage", duration_min: 60, email: "client@example.com" }),
    );
  });

  it("refuses draft services and durations that are not offered", async () => {
    vi.stubEnv("CREDENTIAL_VERIFIED_SERVICES", "massage,stretch-and-mobility");
    vi.stubEnv("CATALOG_PREVIEW_DRAFTS", "true");
    expect((await requestAppointment({ ...request, serviceSlug: "stretch-and-mobility", durationMin: 30 })).status).toBe("error");
    expect((await requestAppointment({ ...request, durationMin: 45 })).status).toBe("error");
    expect(saveLead).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input without storing anything", async () => {
    const result = await requestAppointment({ ...request, email: "nope" });
    expect(result).toMatchObject({ status: "error", fieldErrors: { email: expect.any(String) } });
    expect(saveLead).not.toHaveBeenCalled();
  });
});

describe("public forms", () => {
  it("tells the visitor plainly when the form is not connected", async () => {
    saveLead.mockResolvedValue({ ok: false, reason: "not_configured" });
    const result = await joinWaitlist({ email: "a@b.co", interest: "lounge" });
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/not sent/);
  });

  it("reports rate limiting", async () => {
    saveLead.mockResolvedValue({ ok: false, reason: "rate_limited" });
    const result = await submitContact({
      fullName: "A B",
      email: "a@b.co",
      topic: "Memberships",
      message: "A reasonable question.",
    });
    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/Too many/) });
  });

  it("silently drops honeypot submissions", async () => {
    const result = await joinWaitlist({ email: "a@b.co", interest: "lounge", company: "Acme Bots" });
    expect(result.status).toBe("success");
    expect(saveLead).not.toHaveBeenCalled();
  });

  it("treats a repeat waitlist signup as success", async () => {
    await joinWaitlist({ email: "a@b.co", interest: "memberships" });
    expect(saveLead).toHaveBeenCalledWith(
      "waitlist_entries",
      expect.objectContaining({ email: "a@b.co", interest: "memberships" }),
      { ignoreDuplicates: true },
    );
  });
});
