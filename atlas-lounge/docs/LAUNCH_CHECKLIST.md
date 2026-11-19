# Production launch checklist

Nothing below is assumed done. Tick items only with evidence.

## Legal and compliance (required before launch)

- [ ] Massage therapy licensing: confirm state and local licence requirements for each
      practitioner **and** any establishment/mobile-practice licence for the business
- [ ] Scope of practice reviewed for every service before it is published (Myofascial Release,
      Stretch & Mobility, Muscle Activation and the combination service are drafts until then;
      confirm which require a professional licence and set `required_credential_type`)
- [ ] Any recovery device or equipment reviewed for regulatory status and permitted claims
- [ ] Consumer protection: pricing display, package terms, expiry, refunds, gift/prepaid rules,
      automatic-renewal law for memberships
- [ ] Privacy: applicable state privacy law, health-information handling, data processing
      agreements with Supabase, Stripe, Resend, Twilio (and any AI provider)
- [ ] SMS: TCPA consent wording, A2P 10DLC registration, STOP/HELP handling
- [ ] Privacy Policy and Terms approved by counsel; then set `NEXT_PUBLIC_LEGAL_REVIEWED=true`
- [ ] Intake and consent form wording approved by counsel
- [ ] Liability insurance in place for mobile sessions
- [ ] Retention and deletion periods decided and published
- [ ] Accessibility (ADA / WCAG 2.2 AA) audit completed

## Business content to supply or confirm

- [ ] Contact email, phone, service area, social links
- [ ] Business timezone (`locations.timezone`) and operating hours
- [ ] Cancellation, rescheduling, no-show and deposit policy (`settings` rows are null today)
- [ ] Travel zones and fees
- [ ] Review all website copy; in particular the operational statements on the Mobile Sessions
      and FAQ pages (room requirements, draping, what the practitioner brings) must match how
      you actually operate
- [ ] Approved photography to replace the line-art plates
- [ ] Real testimonials only, with written consent on file; otherwise leave the section empty
- [ ] Decide which proposed services and packages to publish, and at what prices

## Practitioners

- [ ] Each practitioner record created; credentials uploaded, verified by the owner, with
      expiry dates recorded
- [ ] Each practitioner approved per service (`practitioner_services`)
- [ ] `select slug, is_bookable from catalog_services` shows the expected services

## Platform

- [ ] Production Supabase project: migrations applied, seed applied, backups / point-in-time
      recovery confirmed, RLS verified with real `anon` and `authenticated` keys
- [ ] Owner account created and promoted; no shared logins
- [ ] Stripe live mode: keys, webhook endpoint and signing secret, products/prices synced,
      a real low-value payment and refund tested end to end
- [ ] Resend domain verified (SPF, DKIM, DMARC); Twilio number registered
- [ ] All secrets set in Vercel Production only; none in the repository or in `NEXT_PUBLIC_*`
- [ ] `CATALOG_PREVIEW_DRAFTS` unset in production
- [ ] Custom domain, HTTPS, `NEXT_PUBLIC_SITE_URL` correct; robots.txt allows indexing only on
      production
- [ ] Content-Security-Policy enabled and tested
- [ ] Error monitoring and uptime alerts configured
- [ ] `npm run check`, `npm run test:db`, `npm run test:e2e` green on the release commit
- [ ] Full booking rehearsal on staging: book, pay, remind, reschedule, cancel, refund, no-show
- [ ] AI features remain off unless each has been reviewed and switched on deliberately
