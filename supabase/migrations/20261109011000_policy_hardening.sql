-- Keep auth claim lookups out of per-row RLS evaluation, and make the
-- server-only tables' deny-by-default posture explicit.

alter policy "Members can read their registrations" on public.event_registrations
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );

alter policy "Members can read their bookings" on public.space_bookings
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );

create policy "No direct payment access" on public.payments
  for all to anon, authenticated using (false) with check (false);

create policy "No direct inquiry access" on public.inquiries
  for all to anon, authenticated using (false) with check (false);
