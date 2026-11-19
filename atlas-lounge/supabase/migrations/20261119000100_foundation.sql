-- The Atlas Lounge · 01 foundation
-- Extensions, enums, shared helpers, locations/rooms/equipment, profiles and role helpers.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists btree_gist with schema extensions;

create type public.app_role as enum ('owner', 'admin', 'practitioner', 'client');
create type public.catalog_status as enum ('draft', 'published', 'archived');
create type public.location_kind as enum ('mobile', 'studio', 'lounge');
create type public.location_status as enum ('planned', 'active', 'closed');
create type public.resource_status as enum ('planned', 'active', 'retired');

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── Locations, rooms, equipment (multi-location ready; only the mobile practice is active at launch)
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind public.location_kind not null,
  status public.location_status not null default 'planned',
  timezone text not null default 'UTC',            -- IANA name; set per location before it goes active
  address jsonb,
  capacity_limit integer check (capacity_limit is null or capacity_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger locations_updated before update on public.locations
  for each row execute function public.set_updated_at();

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  name text not null,
  kind text not null default 'treatment',
  capacity integer not null default 1 check (capacity > 0),
  status public.resource_status not null default 'planned',
  created_at timestamptz not null default now(),
  unique (location_id, name)
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  name text not null,
  kind text not null,                                -- e.g. cold_plunge, compression, sauna
  capacity integer not null default 1 check (capacity > 0),
  status public.resource_status not null default 'planned',
  created_at timestamptz not null default now(),
  unique (location_id, name)
);

-- ── Profiles (one per auth user) and role helpers
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email extensions.citext,
  full_name text,
  phone text,
  role public.app_role not null default 'client',
  timezone text,
  transactional_email boolean not null default true,
  marketing_email_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  sms_consent_at timestamptz,
  sms_consent_text text,
  stripe_customer_id text unique,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_app_role() in ('owner', 'admin'), false)
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_app_role() in ('owner', 'admin', 'practitioner'), false)
$$;

-- New auth users always start as clients; staff roles are granted afterwards by an owner.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- API callers cannot escalate their own role or rewrite billing identifiers.
-- Owners may set any role; admins may only move people between practitioner and client.
create function public.guard_profile_update() returns trigger
language plpgsql set search_path = '' as $$
declare
  caller public.app_role;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;                                      -- service role / migrations
  end if;
  caller := public.current_app_role();
  if new.role is distinct from old.role then
    if caller = 'owner' then
      null;
    elsif caller = 'admin'
      and old.role in ('practitioner', 'client')
      and new.role in ('practitioner', 'client') then
      null;
    else
      raise exception 'not permitted to change role' using errcode = '42501';
    end if;
  end if;
  if new.stripe_customer_id is distinct from old.stripe_customer_id then
    raise exception 'billing identifiers are managed by the server' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();
