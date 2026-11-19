-- The Atlas Lounge · 02 catalog
-- Services, priced variants, packages, membership tiers, practitioners, credentials, eligibility.

create type public.credential_status as enum ('pending', 'verified', 'rejected', 'expired');

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  category text not null,
  summary text not null,
  description text not null,
  includes text[] not null default '{}',
  designed_for text[] not null default '{}',
  what_to_expect text[] not null default '{}',
  precautions text[] not null default '{}',
  status public.catalog_status not null default 'draft',
  -- When set, the service can only be booked with a practitioner holding a verified,
  -- unexpired credential of this type (see service_is_bookable / practitioner_can_perform).
  required_credential_type text,
  allows_mobile boolean not null default true,
  allows_on_site boolean not null default false,
  buffer_before_min integer not null default 0 check (buffer_before_min >= 0),
  buffer_after_min integer not null default 15 check (buffer_after_min >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

create table public.service_variants (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  duration_min integer not null check (duration_min > 0),
  price_cents integer not null check (price_cents >= 0),
  deposit_cents integer check (deposit_cents is null or deposit_cents >= 0),
  status public.catalog_status not null default 'draft',
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, duration_min),
  check (deposit_cents is null or deposit_cents <= price_cents)
);
create trigger service_variants_updated before update on public.service_variants
  for each row execute function public.set_updated_at();

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null default '',
  service_variant_id uuid not null references public.service_variants (id) on delete restrict,
  session_count integer not null check (session_count > 0),
  price_cents integer not null check (price_cents >= 0),
  validity_days integer check (validity_days is null or validity_days > 0),
  status public.catalog_status not null default 'draft',
  stripe_price_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger packages_updated before update on public.packages
  for each row execute function public.set_updated_at();

create table public.membership_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null default '',
  location_id uuid references public.locations (id) on delete set null,
  price_cents integer check (price_cents is null or price_cents >= 0),
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  benefits jsonb not null default '[]',
  capacity_limit integer check (capacity_limit is null or capacity_limit > 0),
  status public.catalog_status not null default 'draft',
  stripe_price_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger membership_tiers_updated before update on public.membership_tiers
  for each row execute function public.set_updated_at();

create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  display_name text not null,
  bio text,
  is_active boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger practitioners_updated before update on public.practitioners
  for each row execute function public.set_updated_at();

create table public.practitioner_credentials (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  credential_type text not null,                    -- matches services.required_credential_type
  license_number text,
  issuing_authority text,
  jurisdiction text,
  issued_on date,
  expires_on date,
  document_path text,                               -- private storage object, never a public URL
  status public.credential_status not null default 'pending',
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'verified' or (verified_by is not null and verified_at is not null))
);
create index practitioner_credentials_lookup
  on public.practitioner_credentials (practitioner_id, credential_type, status);
create trigger practitioner_credentials_updated before update on public.practitioner_credentials
  for each row execute function public.set_updated_at();

-- Which services each practitioner has been approved to deliver.
create table public.practitioner_services (
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz not null default now(),
  primary key (practitioner_id, service_id)
);

-- A practitioner can perform a service when active, approved for it, and (if the service
-- requires one) holding a verified credential that has not expired.
create function public.practitioner_can_perform(p_practitioner uuid, p_service uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.practitioners p
    join public.practitioner_services ps
      on ps.practitioner_id = p.id and ps.service_id = p_service
    join public.services s on s.id = p_service
    where p.id = p_practitioner
      and p.is_active
      and (
        s.required_credential_type is null
        or exists (
          select 1 from public.practitioner_credentials c
          where c.practitioner_id = p.id
            and c.credential_type = s.required_credential_type
            and c.status = 'verified'
            and (c.expires_on is null or c.expires_on >= current_date)
        )
      )
  )
$$;

-- A service is publicly bookable only when published, priced, and at least one practitioner
-- can perform it. Draft services and services without verified practitioners never are.
create function public.service_is_bookable(p_service uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.services s
    where s.id = p_service
      and s.status = 'published'
      and exists (
        select 1 from public.service_variants v
        where v.service_id = s.id and v.status = 'published'
      )
      and exists (
        select 1 from public.practitioner_services ps
        where ps.service_id = s.id
          and public.practitioner_can_perform(ps.practitioner_id, s.id)
      )
  )
$$;

create view public.catalog_services with (security_invoker = true) as
  select s.*, public.service_is_bookable(s.id) as is_bookable
  from public.services s;
