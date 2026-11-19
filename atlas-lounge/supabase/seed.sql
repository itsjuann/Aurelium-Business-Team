-- GENERATED FILE. Do not edit by hand.
-- Source: src/content/catalog.json · Regenerate: npm run db:seed:generate
-- Idempotent: safe to re-run. Existing rows are left untouched so that prices and copy
-- edited in the admin dashboard are never overwritten by a re-seed.

insert into public.locations (slug, name, kind, status) values
  ('private-mobile', 'Private Mobile Sessions', 'mobile', 'active'),
  ('the-atlas-lounge', 'The Atlas Lounge', 'lounge', 'planned')
on conflict (slug) do nothing;

insert into public.settings (key, value, description) values
  ('booking.cancellation_window_hours', 'null', 'Hours before start when free cancellation ends. Set before launch.'),
  ('booking.hold_minutes', '15', 'Minutes an unpaid appointment hold is kept.'),
  ('booking.min_lead_hours', 'null', 'Minimum notice required for a new booking. Set before launch.'),
  ('ai.faq_assistant_enabled', 'false', 'Administrator switch for the website FAQ assistant.'),
  ('ai.booking_assistance_enabled', 'false', 'Administrator switch for booking assistance.'),
  ('ai.service_recommendations_enabled', 'false', 'Administrator switch for general service recommendations.'),
  ('ai.follow_up_drafts_enabled', 'false', 'Administrator switch for follow-up message drafts.'),
  ('ai.analytics_summaries_enabled', 'false', 'Administrator switch for business analytics summaries.')
on conflict (key) do nothing;

insert into public.services (slug, name, category, summary, description, includes, designed_for,
  what_to_expect, precautions, status, required_credential_type, buffer_before_min, buffer_after_min, sort_order)
values ('massage', 'Massage', 'Massage', 'An unhurried, full-body or focused session shaped around how you feel on the day.',
  'A private massage session, paced to you. Your practitioner begins with a short conversation about what you would like from the time, then works with pressure and tempo you are comfortable with, whether that is a full-body session or closer attention to a few areas.',
  array['A brief conversation before the session to agree focus and pressure', 'Hands-on massage for the full booked duration', 'Time to settle before and after, so the session never feels rushed'],
  array['Anyone who wants dedicated time to rest and unwind', 'People who train regularly and want recovery built into their week', 'Those who spend long days seated, travelling, or on their feet'],
  array['You choose the duration: 60, 90, or 120 minutes', 'Your practitioner checks in on pressure and comfort throughout', 'You remain appropriately draped at all times', 'You may ask to adjust, pause, or end the session at any point'],
  array['Massage is not medical treatment and is not a substitute for care from a licensed healthcare provider.', 'If you are pregnant, recovering from surgery or injury, or managing a medical condition, please speak with your healthcare provider before booking.', 'Tell us in advance about allergies, skin sensitivities, or areas you would like avoided.', 'Please reschedule if you are unwell or have a fever.'],
  'published', 'massage_therapy', 0, 15, 10)
on conflict (slug) do nothing;

insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 60, 12000, 'published' from public.services where slug = 'massage'
on conflict (service_id, duration_min) do nothing;
insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 90, 17000, 'published' from public.services where slug = 'massage'
on conflict (service_id, duration_min) do nothing;
insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 120, 22000, 'published' from public.services where slug = 'massage'
on conflict (service_id, duration_min) do nothing;

insert into public.services (slug, name, category, summary, description, includes, designed_for,
  what_to_expect, precautions, status, required_credential_type, buffer_before_min, buffer_after_min, sort_order)
values ('myofascial-release', 'Myofascial Release', 'Massage', 'Slow, sustained hands-on work for areas that feel tight or restricted.',
  'A slower style of hands-on work that uses sustained, gentle pressure rather than flowing strokes. Sessions concentrate on a small number of areas and move at a deliberate pace.',
  array['A conversation about the areas you would like to focus on', 'Sustained, low-intensity hands-on techniques', 'Simple suggestions for movement between sessions'],
  array['People who prefer slow, focused work over a full-body session', 'Those who notice the same areas feeling tight week after week'],
  array['Little or no oil is used, so wear or bring comfortable clothing', 'Pressure is held for longer than in a typical massage', 'Your practitioner works within your comfort at all times'],
  array['This session is not medical treatment and does not diagnose or treat any condition.', 'Please speak with your healthcare provider first if you have a medical condition, recent injury, or recent surgery.', 'Let us know about any areas that are painful or sensitive.'],
  'draft', 'massage_therapy', 0, 15, 20)
on conflict (slug) do nothing;

insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 60, 13000, 'draft' from public.services where slug = 'myofascial-release'
on conflict (service_id, duration_min) do nothing;

insert into public.services (slug, name, category, summary, description, includes, designed_for,
  what_to_expect, precautions, status, required_credential_type, buffer_before_min, buffer_after_min, sort_order)
values ('stretch-and-mobility', 'Stretch & Mobility', 'Mobility', 'Practitioner-guided stretching and movement, at a pace that suits you.',
  'A guided session of assisted stretching and gentle movement. Your practitioner leads you through each position, working within a comfortable range and adjusting as you go.',
  array['A short movement check-in to decide where to spend the time', 'Practitioner-assisted stretching', 'A few movements to continue on your own'],
  array['People who want to move more comfortably day to day', 'Those who train and want mobility work alongside it', 'Anyone who finds it hard to make time to stretch'],
  array['You stay fully clothed, so wear something you can move in', 'Stretches are held within a comfortable range, never forced', 'Sessions run 30 or 60 minutes'],
  array['This session is not medical treatment or physical therapy.', 'Please speak with your healthcare provider first if you have a joint condition, recent injury, or recent surgery.', 'Tell your practitioner straight away if any position is uncomfortable.'],
  'draft', null, 0, 15, 30)
on conflict (slug) do nothing;

insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 30, 9000, 'draft' from public.services where slug = 'stretch-and-mobility'
on conflict (service_id, duration_min) do nothing;
insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 60, 15000, 'draft' from public.services where slug = 'stretch-and-mobility'
on conflict (service_id, duration_min) do nothing;

insert into public.services (slug, name, category, summary, description, includes, designed_for,
  what_to_expect, precautions, status, required_credential_type, buffer_before_min, buffer_after_min, sort_order)
values ('muscle-activation', 'Muscle Activation', 'Activation', 'Targeted, low-intensity work to prepare the body for movement.',
  'A focused session of light, targeted exercises and hands-on cues intended to help you feel prepared for training or daily activity.',
  array['A brief movement check-in', 'Guided, low-intensity activation exercises', 'A short routine to repeat before activity'],
  array['People preparing for training, sport, or an active day', 'Those returning to regular movement after time away'],
  array['You stay fully clothed, so wear something you can move in', 'Work is light and controlled rather than strenuous', 'Sessions run 30 or 60 minutes'],
  array['This session is not medical treatment or physical therapy.', 'Please speak with your healthcare provider first if you have an injury or medical condition.', 'Stop and tell your practitioner if anything feels painful.'],
  'draft', null, 0, 15, 40)
on conflict (slug) do nothing;

insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 30, 8000, 'draft' from public.services where slug = 'muscle-activation'
on conflict (service_id, duration_min) do nothing;
insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 60, 14000, 'draft' from public.services where slug = 'muscle-activation'
on conflict (service_id, duration_min) do nothing;

insert into public.services (slug, name, category, summary, description, includes, designed_for,
  what_to_expect, precautions, status, required_credential_type, buffer_before_min, buffer_after_min, sort_order)
values ('massage-and-muscle-activation', 'Massage + Muscle Activation', 'Combination', 'Hands-on massage paired with guided activation in a single session.',
  'A combined session that begins with massage and finishes with a short sequence of guided activation work, so you leave feeling both rested and ready to move.',
  array['A conversation to agree how the time is divided', 'Hands-on massage', 'Guided, low-intensity activation exercises'],
  array['People who want recovery and preparation in one appointment', 'Those with limited time who train regularly'],
  array['The session moves from the table to light movement', 'Bring or wear clothing you can move in for the second part', 'Sessions run 60 or 90 minutes'],
  array['This session is not medical treatment and is not a substitute for care from a licensed healthcare provider.', 'Please speak with your healthcare provider first if you are pregnant, injured, or managing a medical condition.', 'Tell us in advance about allergies, sensitivities, or areas to avoid.'],
  'draft', 'massage_therapy', 0, 15, 50)
on conflict (slug) do nothing;

insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 60, 15000, 'draft' from public.services where slug = 'massage-and-muscle-activation'
on conflict (service_id, duration_min) do nothing;
insert into public.service_variants (service_id, duration_min, price_cents, status)
select id, 90, 20000, 'draft' from public.services where slug = 'massage-and-muscle-activation'
on conflict (service_id, duration_min) do nothing;

insert into public.packages (slug, name, summary, service_variant_id, session_count, price_cents, status, sort_order)
select 'essential-recovery', 'Essential Recovery', 'Four 60-minute massage sessions.', v.id, 4, 44000, 'draft', 10
from public.service_variants v join public.services s on s.id = v.service_id
where s.slug = 'massage' and v.duration_min = 60
on conflict (slug) do nothing;

insert into public.packages (slug, name, summary, service_variant_id, session_count, price_cents, status, sort_order)
select 'enhanced-recovery', 'Enhanced Recovery', 'Four 90-minute massage sessions.', v.id, 4, 62000, 'draft', 20
from public.service_variants v join public.services s on s.id = v.service_id
where s.slug = 'massage' and v.duration_min = 90
on conflict (slug) do nothing;

insert into public.packages (slug, name, summary, service_variant_id, session_count, price_cents, status, sort_order)
select 'performance-recovery', 'Performance Recovery', 'Eight 60-minute massage sessions.', v.id, 8, 84000, 'draft', 30
from public.service_variants v join public.services s on s.id = v.service_id
where s.slug = 'massage' and v.duration_min = 60
on conflict (slug) do nothing;

insert into public.packages (slug, name, summary, service_variant_id, session_count, price_cents, status, sort_order)
select 'elite-recovery', 'Elite Recovery', 'Eight 90-minute massage sessions.', v.id, 8, 120000, 'draft', 40
from public.service_variants v join public.services s on s.id = v.service_id
where s.slug = 'massage' and v.duration_min = 90
on conflict (slug) do nothing;
