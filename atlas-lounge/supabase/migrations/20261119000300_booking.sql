-- The Atlas Lounge · 03 booking
-- Travel zones, availability, appointments with database-level double-booking protection,
-- packages owned by clients, memberships, intake, consent, restricted notes, reservations.

set search_path = public, extensions;

create type public.appointment_status as enum
  ('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show', 'expired');
create type public.appointment_type as enum ('mobile', 'on_site');

create table public.travel_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  postal_codes text[] not null default '{}',
  fee_cents integer not null default 0 check (fee_cents >= 0),
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger travel_zones_updated before update on public.travel_zones
  for each row execute function public.set_updated_at();

-- Weekly working hours, in the practitioner's location timezone.
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  location_id uuid references public.locations (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  check (start_time < end_time),
  check (valid_to is null or valid_to >= valid_from)
);
create index availability_rules_lookup on public.availability_rules (practitioner_id, weekday);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  kind text not null check (kind in ('time_off', 'extra_hours')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);
create index availability_exceptions_lookup
  on public.availability_exceptions (practitioner_id, starts_at);

create table public.client_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete restrict,
  package_id uuid not null references public.packages (id) on delete restrict,
  sessions_total integer not null check (sessions_total > 0),
  sessions_remaining integer not null,
  status text not null default 'active'
    check (status in ('active', 'exhausted', 'expired', 'refunded')),
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  check (sessions_remaining between 0 and sessions_total)
);
create index client_packages_client on public.client_packages (client_id);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete restrict,
  tier_id uuid not null references public.membership_tiers (id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'past_due', 'paused', 'cancelled')),
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index memberships_client on public.memberships (client_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete restrict,
  practitioner_id uuid not null references public.practitioners (id) on delete restrict,
  service_variant_id uuid not null references public.service_variants (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,   -- set by trigger
  appointment_type public.appointment_type not null default 'mobile',
  location_id uuid references public.locations (id),
  room_id uuid references public.rooms (id),
  travel_zone_id uuid references public.travel_zones (id),
  service_address jsonb,
  status public.appointment_status not null default 'pending_payment',
  starts_at timestamptz not null,
  duration_min integer not null check (duration_min > 0),
  ends_at timestamptz not null,                     -- set by trigger
  buffer_before_min integer not null default 0 check (buffer_before_min >= 0),
  buffer_after_min integer not null default 0 check (buffer_after_min >= 0),
  blocked_from timestamptz not null,                -- set by trigger (start minus buffer)
  blocked_until timestamptz not null,               -- set by trigger (end plus buffer)
  price_cents integer not null check (price_cents >= 0),
  travel_fee_cents integer not null default 0 check (travel_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  client_package_id uuid references public.client_packages (id),
  hold_expires_at timestamptz,                      -- unpaid holds are released after this
  rescheduled_from uuid references public.appointments (id),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (appointment_type <> 'on_site' or location_id is not null),

  -- Double-booking protection. Two live appointments for one practitioner can never overlap,
  -- buffers included, regardless of how many requests race. Same for a room.
  constraint appointments_no_practitioner_overlap exclude using gist (
    practitioner_id with =,
    tstzrange(blocked_from, blocked_until, '[)') with &&
  ) where (status in ('pending_payment', 'confirmed', 'completed')),
  constraint appointments_no_room_overlap exclude using gist (
    room_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (room_id is not null and status in ('pending_payment', 'confirmed', 'completed'))
);
create index appointments_client on public.appointments (client_id, starts_at desc);
create index appointments_practitioner on public.appointments (practitioner_id, starts_at);
create index appointments_status on public.appointments (status, starts_at);

create function public.appointments_prepare() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_service uuid;
begin
  select service_id into v_service
  from public.service_variants where id = new.service_variant_id;
  if v_service is null then
    raise exception 'unknown service variant' using errcode = '23503';
  end if;
  new.service_id := v_service;
  new.ends_at := new.starts_at + make_interval(mins => new.duration_min);
  new.blocked_from := new.starts_at - make_interval(mins => new.buffer_before_min);
  new.blocked_until := new.ends_at + make_interval(mins => new.buffer_after_min);

  -- Eligibility gate: a live appointment requires a practitioner who can perform the service
  -- (active, approved, and credentialed where the service demands it).
  if new.status in ('pending_payment', 'confirmed')
     and (tg_op = 'INSERT'
          or new.practitioner_id is distinct from old.practitioner_id
          or new.service_variant_id is distinct from old.service_variant_id
          or old.status not in ('pending_payment', 'confirmed'))
     and not public.practitioner_can_perform(new.practitioner_id, v_service) then
    raise exception 'practitioner is not eligible to perform this service'
      using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end $$;

create trigger appointments_prepare before insert or update on public.appointments
  for each row execute function public.appointments_prepare();

-- Sensitive records ---------------------------------------------------------------

create table public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  form_version text not null,
  responses jsonb not null,
  submitted_at timestamptz not null default now()
);
create index intake_forms_client on public.intake_forms (client_id, submitted_at desc);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  consent_type text not null,                       -- e.g. treatment, mobile_visit, sms
  document_version text not null,
  accepted_at timestamptz not null default now(),
  ip inet,
  user_agent text
);
create index consent_records_client on public.consent_records (client_id, accepted_at desc);

create table public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  appointment_id uuid references public.appointments (id) on delete set null,
  visibility text not null default 'care_team' check (visibility in ('care_team', 'admin_only')),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_notes_client on public.client_notes (client_id, created_at desc);
create trigger client_notes_updated before update on public.client_notes
  for each row execute function public.set_updated_at();

-- A practitioner may see a client's sensitive records only around an appointment with them.
create function public.is_practitioner_for(p_client uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.appointments a
    join public.practitioners p on p.id = a.practitioner_id
    where a.client_id = p_client
      and p.profile_id = auth.uid()
      and a.status in ('confirmed', 'completed')
      and a.starts_at > now() - interval '30 days'
  )
$$;

-- Future lounge: equipment reservations (schema only; nothing is bookable until equipment
-- and its location are marked active).
create table public.equipment_reservations (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment (id) on delete restrict,
  client_id uuid not null references public.profiles (id) on delete restrict,
  slot_index integer not null default 1 check (slot_index > 0),   -- 1..equipment.capacity
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (starts_at < ends_at),
  constraint equipment_reservations_no_overlap exclude using gist (
    equipment_id with =,
    slot_index with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmed')
);

create function public.equipment_reservations_guard() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_capacity integer;
  v_status public.resource_status;
begin
  select capacity, status into v_capacity, v_status
  from public.equipment where id = new.equipment_id;
  if v_status is distinct from 'active' then
    raise exception 'equipment is not available for reservation' using errcode = '23514';
  end if;
  if new.slot_index > v_capacity then
    raise exception 'equipment capacity exceeded' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger equipment_reservations_guard before insert or update
  on public.equipment_reservations
  for each row execute function public.equipment_reservations_guard();
