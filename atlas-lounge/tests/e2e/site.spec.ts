import { expect, test } from "@playwright/test";

const pages: [path: string, heading: RegExp][] = [
  ["/", /Recovery/],
  ["/about", /A practice first/],
  ["/services", /A short menu/],
  ["/services/massage", /^Massage$/],
  ["/pricing", /Clear prices/],
  ["/book", /Booking opens soon/],
  ["/memberships", /Membership, in the making/],
  ["/mobile-sessions", /The lounge comes to you/],
  ["/future-lounge", /A place to recover/],
  ["/faqs", /Questions, answered plainly/],
  ["/contact", /Write to us/],
  ["/login", /Client accounts are on their way/],
  ["/privacy", /Privacy Policy/],
  ["/terms", /^Terms$/],
];

test.describe("public pages", () => {
  for (const [path, heading] of pages) {
    test(`${path} renders without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("unknown pages return 404", async ({ page }) => {
    const response = await page.goto("/nope");
    expect(response?.status()).toBe(404);
  });
});

test.describe("honesty safeguards", () => {
  test("draft services and packages are not public", async ({ page }) => {
    for (const slug of ["myofascial-release", "stretch-and-mobility", "muscle-activation", "massage-and-muscle-activation"]) {
      await page.goto(`/services/${slug}`);
      await expect(page.getByRole("heading", { level: 1 }), slug).toHaveText(/wandered off the map/);
      await expect(page.locator('meta[name="robots"][content*="noindex"]').first(), slug).toBeAttached();
      await expect(page.getByText(/Draft|minutes/), slug).toHaveCount(0);
    }
    await page.goto("/pricing");
    await expect(page.getByText("$120")).toBeVisible();
    await expect(page.getByText("$170")).toBeVisible();
    await expect(page.getByText("$220")).toBeVisible();
    for (const name of ["Essential Recovery", "Elite Recovery", "Myofascial", "$440", "$1,200"]) {
      await expect(page.getByText(name)).toHaveCount(0);
    }
    await page.goto("/sitemap.xml");
    expect(await page.content()).not.toContain("myofascial");
  });

  test("booking stays closed until practitioner credentials are verified", async ({ page }) => {
    await page.goto("/book?service=massage");
    await expect(page.getByRole("button", { name: "Request appointment" })).toHaveCount(0);
    await expect(page.getByText(/credentials have been verified/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Notify me" })).toBeVisible();
  });

  test("future amenities are labelled as planned and cannot be booked", async ({ page }) => {
    await page.goto("/future-lounge");
    await expect(page.getByText("Planned · not yet available")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cold plunge" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: /book|reserve|buy|purchase/i })).toHaveCount(1); // only the mobile-session CTA
  });

  test("no testimonials are shown without approved ones", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("In their words")).toHaveCount(0);
    await expect(page.locator("blockquote")).toHaveCount(0);
  });

  test("legal pages are flagged as drafts until reviewed", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText("Draft pending legal review.")).toBeVisible();
  });

  test("previews are not indexable", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow: \/\s*$/m);
  });
});

test.describe("forms", () => {
  test("waitlist validates email and reports honestly when not connected", async ({ page }) => {
    await page.goto("/future-lounge");
    const form = page.locator("form");
    await form.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(form.getByRole("alert")).toHaveText(/valid email/);

    await form.getByLabel("Email address").fill("guest@example.com");
    await form.getByRole("button", { name: "Join the waitlist" }).click();
    // This test run has no database, so the form must say the details were not sent.
    await expect(form.getByRole("alert")).toHaveText(/not connected yet/);
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("contact form shows field errors", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByText("Please tell us a little more.")).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  });
});

test.describe("navigation", () => {
  test("primary journey reaches the booking page", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Services" }).click();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Services" }).click();
    }
    await expect(page).toHaveURL(/\/services$/);
    await page.getByRole("link", { name: /Massage/ }).first().click();
    await expect(page).toHaveURL(/\/services\/massage$/);
    await page.getByRole("link", { name: "Register to book" }).first().click();
    await expect(page).toHaveURL(/\/book\?service=massage$/);
  });

  test("security headers are set", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toContain("max-age");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
