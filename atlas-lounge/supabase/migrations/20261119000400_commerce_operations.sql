-- The Atlas Lounge · 04 commerce and operations
-- Payments (Stripe references only; no card data), refunds, discounts, webhook idempotency,
-- notifications, lead capture, testimonials, content, settings, audit log, rate limiting.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete restrict,
  kind text not null check (kind in ('appointment', 'package', 'membership')),
  appointment_id uuid references public.appointments (id),
  client_package_id uuid references public.client_packages (id),
  membership_id uuid references public.memberships (id),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_invoice_id text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_client on public.payments (client_id, created_at desc);
create trigger payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  stripe_refund_id text unique,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code extensions.citext not null unique,
  kind text not null check (kind in ('percent', 'fixed')),
  value integer not null check (value > 0),
  applies_to text not null default 'all' check (applies_to in ('all', 'services', 'packages')),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redeemed_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100),
  check (max_redemptions is null or redeemed_count <= max_redemptions)
);
create trigger discount_codes_updated before update on public.discount_codes
  for each row execute function public.set_updated_at();

create table public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes (id) on delete restrict,
  client_id uuid not null references public.profiles (id) on delete restrict,
  payment_id uuid references public.payments (id),
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

-- Stripe webhook idempotency: each event id is processed at most once.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create table public.email_templates (
  key text primary key,
  subject text not null,
  body text not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  template_key text not null,
  recipient text not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'cancelled')),
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);
create index notifications_due on public.notifications (scheduled_for) where status = 'queued';

-- Public lead capture. Written only by the server (service role); never readable by visitors.
create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null,
  full_name text,
  interest text not null check (interest in ('lounge', 'memberships', 'booking', 'services')),
  source text,
  created_at timestamptz not null default now(),
  unique (email, interest)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email extensions.citext not null,
  phone text,
  topic text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email extensions.citext not null,
  phone text not null,
  service_slug text not null,
  duration_min integer not null check (duration_min > 0),
  postal_code text not null,
  preferred_times text not null,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'converted', 'declined')),
  created_at timestamptz not null default now()
);

-- Testimonials are public only when approved, consented to, and published.
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_display text not null,
  quote text not null,
  service_id uuid references public.services (id) on delete set null,
  consent_on_file boolean not null default false,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check (not is_published or (consent_on_file and approved_at is not null))
);

create table public.site_content (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

-- Append-only audit trail of changes to configuration and operational records.
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_role text,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity on public.audit_logs (entity, entity_id, created_at desc);
create index audit_logs_actor on public.audit_logs (actor_id, created_at desc);

create function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_before jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_after jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
begin
  insert into public.audit_logs (actor_id, actor_role, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    coalesce(public.current_app_role()::text, session_user),
    lower(tg_op),
    tg_table_name,
    coalesce(v_after ->> 'id', v_before ->> 'id', v_after ->> 'key', v_before ->> 'key'),
    v_before,
    v_after
  );
  return coalesce(new, old);
end $$;

-- Audited tables. Intake forms, consent records and client notes are deliberately excluded so
-- their contents are never copied into the audit trail.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'locations', 'services', 'service_variants', 'packages', 'membership_tiers',
    'practitioners', 'practitioner_credentials', 'practitioner_services', 'travel_zones',
    'availability_rules', 'availability_exceptions', 'appointments', 'client_packages',
    'memberships', 'refunds', 'discount_codes', 'email_templates', 'testimonials',
    'site_content', 'settings'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_row_change()', t || '_audit', t);
  end loop;
end $$;

-- Fixed-window rate limiting shared across server instances.
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (key, window_start)
);

create function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into v_count;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_count <= p_max;
end $$;
