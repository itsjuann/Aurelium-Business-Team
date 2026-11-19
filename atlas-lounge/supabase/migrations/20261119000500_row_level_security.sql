-- The Atlas Lounge · 05 row-level security
-- Every table has RLS enabled. Anything without a policy is reachable only by the service
-- role (server-side code). Clients never write appointments or payments directly: those go
-- through server-side transactional logic.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Helper: staff-managed tables get one "admins manage everything" policy.
do $$
declare t text;
begin
  foreach t in array array[
    'locations', 'rooms', 'equipment', 'services', 'service_variants', 'packages',
    'membership_tiers', 'practitioners', 'practitioner_credentials', 'practitioner_services',
    'travel_zones', 'availability_rules', 'availability_exceptions', 'appointments',
    'client_packages', 'memberships', 'equipment_reservations', 'payments', 'refunds',
    'discount_codes', 'discount_redemptions', 'email_templates', 'notifications',
    'waitlist_entries', 'contact_messages', 'booking_requests', 'testimonials',
    'site_content', 'settings', 'client_notes'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t || '_admin_all', t);
  end loop;
end $$;

-- ── Public, read-only catalog (published rows only; drafts are invisible)
create policy locations_public_read on public.locations
  for select to anon, authenticated using (status = 'active');
create policy rooms_public_read on public.rooms
  for select to anon, authenticated using (status = 'active');
create policy equipment_public_read on public.equipment
  for select to anon, authenticated using (status = 'active');
create policy services_public_read on public.services
  for select to anon, authenticated using (status = 'published');
create policy service_variants_public_read on public.service_variants
  for select to anon, authenticated using (
    status = 'published'
    and exists (select 1 from public.services s
                where s.id = service_id and s.status = 'published'));
create policy packages_public_read on public.packages
  for select to anon, authenticated using (status = 'published');
create policy membership_tiers_public_read on public.membership_tiers
  for select to anon, authenticated using (status = 'published');
create policy practitioners_public_read on public.practitioners
  for select to anon, authenticated using (is_active and is_public);
create policy travel_zones_public_read on public.travel_zones
  for select to anon, authenticated using (is_active);
create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated
  using (is_published and consent_on_file and approved_at is not null);
create policy site_content_public_read on public.site_content
  for select to anon, authenticated using (true);

-- ── Profiles
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_read on public.profiles
  for select to authenticated using (public.is_admin());
create policy profiles_admin_update on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy profiles_practitioner_read on public.profiles
  for select to authenticated using (public.is_practitioner_for(id));

-- ── Practitioners see their own record, credentials, services and schedule
create policy practitioners_self_read on public.practitioners
  for select to authenticated using (profile_id = auth.uid());
create policy practitioner_credentials_self_read on public.practitioner_credentials
  for select to authenticated using (
    exists (select 1 from public.practitioners p
            where p.id = practitioner_id and p.profile_id = auth.uid()));
create policy practitioner_services_self_read on public.practitioner_services
  for select to authenticated using (
    exists (select 1 from public.practitioners p
            where p.id = practitioner_id and p.profile_id = auth.uid()));
create policy availability_rules_self_manage on public.availability_rules
  for all to authenticated
  using (exists (select 1 from public.practitioners p
                 where p.id = practitioner_id and p.profile_id = auth.uid()))
  with check (exists (select 1 from public.practitioners p
                      where p.id = practitioner_id and p.profile_id = auth.uid()));
create policy availability_exceptions_self_manage on public.availability_exceptions
  for all to authenticated
  using (exists (select 1 from public.practitioners p
                 where p.id = practitioner_id and p.profile_id = auth.uid()))
  with check (exists (select 1 from public.practitioners p
                      where p.id = practitioner_id and p.profile_id = auth.uid()));

-- ── Appointments and what clients own (read-only for clients; writes are server-side)
create policy appointments_client_read on public.appointments
  for select to authenticated using (client_id = auth.uid());
create policy appointments_practitioner_read on public.appointments
  for select to authenticated using (
    exists (select 1 from public.practitioners p
            where p.id = practitioner_id and p.profile_id = auth.uid()));
create policy client_packages_client_read on public.client_packages
  for select to authenticated using (client_id = auth.uid());
create policy memberships_client_read on public.memberships
  for select to authenticated using (client_id = auth.uid());
create policy equipment_reservations_client_read on public.equipment_reservations
  for select to authenticated using (client_id = auth.uid());
create policy payments_client_read on public.payments
  for select to authenticated using (client_id = auth.uid());
create policy refunds_client_read on public.refunds
  for select to authenticated using (
    exists (select 1 from public.payments p
            where p.id = payment_id and p.client_id = auth.uid()));
create policy notifications_client_read on public.notifications
  for select to authenticated using (client_id = auth.uid());

-- ── Intake and consent: the client, administrators, and the treating practitioner only
create policy intake_forms_client_read on public.intake_forms
  for select to authenticated using (client_id = auth.uid());
create policy intake_forms_client_insert on public.intake_forms
  for insert to authenticated with check (client_id = auth.uid());
create policy intake_forms_admin_read on public.intake_forms
  for select to authenticated using (public.is_admin());
create policy intake_forms_practitioner_read on public.intake_forms
  for select to authenticated using (public.is_practitioner_for(client_id));

create policy consent_records_client_read on public.consent_records
  for select to authenticated using (client_id = auth.uid());
create policy consent_records_client_insert on public.consent_records
  for insert to authenticated with check (client_id = auth.uid());
create policy consent_records_admin_read on public.consent_records
  for select to authenticated using (public.is_admin());
create policy consent_records_practitioner_read on public.consent_records
  for select to authenticated using (public.is_practitioner_for(client_id));

-- ── Client notes: never visible to clients. Practitioners see care-team notes for their
--    own clients and may add notes; admin-only notes stay with owner/admin.
create policy client_notes_practitioner_read on public.client_notes
  for select to authenticated using (
    visibility = 'care_team'
    and public.current_app_role() = 'practitioner'
    and public.is_practitioner_for(client_id));
create policy client_notes_practitioner_insert on public.client_notes
  for insert to authenticated with check (
    author_id = auth.uid()
    and visibility = 'care_team'
    and public.current_app_role() = 'practitioner'
    and public.is_practitioner_for(client_id));

-- ── Audit log: administrators may read; nobody may alter or delete through the API
create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated using (public.is_admin());
revoke insert, update, delete, truncate on public.audit_logs from anon, authenticated;
revoke update, delete, truncate on public.audit_logs from service_role;

-- stripe_events and rate_limits have no policies: service role only.

-- ── Function privileges: internal helpers are not callable by visitors
revoke execute on function public.check_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.audit_row_change() from public, anon, authenticated;
