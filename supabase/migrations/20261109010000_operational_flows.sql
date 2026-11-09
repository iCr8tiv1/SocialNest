-- Make the public platform operational without exposing a service-role key.
-- Each RPC is a deliberately narrow API: it validates input, computes trusted
-- values in Postgres, and returns only the data needed by the caller.

-- Signed-in members can read only records that belong to them.
grant select on public.event_registrations to authenticated;
grant select on public.space_bookings to authenticated;
grant select on public.referrals to authenticated;

create policy "Members can read their registrations" on public.event_registrations
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

create policy "Members can read their bookings" on public.space_bookings
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

create policy "Members can read their referrals" on public.referrals
  for select to authenticated
  using (from_user = (select auth.uid()) or to_user = (select auth.uid()));

-- Referral writes use column grants plus ownership-aware policies.
grant insert (from_user, to_user, contact_name, contact_email, contact_phone, notes)
  on public.referrals to authenticated;
grant update (status, value_cents) on public.referrals to authenticated;

create policy "Directory members can send referrals" on public.referrals
  for insert to authenticated
  with check (
    from_user = (select auth.uid())
    and from_user <> to_user
    and exists (
      select 1 from public.profiles sender
      where sender.id = (select auth.uid()) and sender.directory_visible
    )
    and exists (
      select 1 from public.profiles recipient
      where recipient.id = to_user and recipient.directory_visible
    )
  );

create policy "Recipients can update referral outcomes" on public.referrals
  for update to authenticated
  using (to_user = (select auth.uid()))
  with check (to_user = (select auth.uid()));

create or replace function public.get_my_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.profiles p
  where p.id = (select auth.uid())
  limit 1
$$;

create or replace function public.save_my_profile(
  p_full_name text,
  p_phone text,
  p_business_name text,
  p_title text,
  p_industry text,
  p_website text,
  p_linkedin text,
  p_city text,
  p_bio text,
  p_directory_visible boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_directory_visible and (nullif(trim(p_full_name), '') is null or nullif(trim(p_business_name), '') is null) then
    raise exception 'A name and business are required for the directory' using errcode = '22023';
  end if;
  if char_length(coalesce(p_full_name, '')) > 120
     or char_length(coalesce(p_phone, '')) > 40
     or char_length(coalesce(p_business_name, '')) > 160
     or char_length(coalesce(p_title, '')) > 120
     or char_length(coalesce(p_industry, '')) > 80
     or char_length(coalesce(p_website, '')) > 300
     or char_length(coalesce(p_linkedin, '')) > 300
     or char_length(coalesce(p_city, '')) > 80
     or char_length(coalesce(p_bio, '')) > 1200 then
    raise exception 'Profile field is too long' using errcode = '22023';
  end if;

  insert into public.profiles (
    id, email, full_name, phone, business_name, title, industry,
    website, linkedin, city, bio, directory_visible
  ) values (
    v_user_id, v_email, nullif(trim(p_full_name), ''), nullif(trim(p_phone), ''),
    nullif(trim(p_business_name), ''), nullif(trim(p_title), ''), nullif(trim(p_industry), ''),
    nullif(trim(p_website), ''), nullif(trim(p_linkedin), ''), nullif(trim(p_city), ''),
    nullif(trim(p_bio), ''), coalesce(p_directory_visible, false)
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    business_name = excluded.business_name,
    title = excluded.title,
    industry = excluded.industry,
    website = excluded.website,
    linkedin = excluded.linkedin,
    city = excluded.city,
    bio = excluded.bio,
    directory_visible = excluded.directory_visible;
end;
$$;

create or replace function public.event_seats_taken(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when exists (
    select 1 from public.events e
    where e.id = p_event_id and e.status in ('published', 'cancelled')
  ) then coalesce((
    select sum(r.quantity)::integer
    from public.event_registrations r
    where r.event_id = p_event_id
      and (
        r.status = 'confirmed'
        or (r.status = 'pending_payment' and r.created_at > now() - interval '35 minutes')
      )
  ), 0) else 0 end
$$;

create or replace function public.register_free_event(
  p_event_id uuid,
  p_name text,
  p_email text,
  p_phone text default null,
  p_business_name text default null,
  p_industry text default null,
  p_notes text default null,
  p_quantity integer default 1
)
returns table (registration_id uuid, checkin_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_taken integer;
begin
  if nullif(trim(p_name), '') is null or char_length(trim(p_name)) > 120 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;
  if nullif(trim(p_email), '') is null or position('@' in p_email) < 2 or char_length(trim(p_email)) > 200 then
    raise exception 'A valid email is required' using errcode = '22023';
  end if;
  if char_length(coalesce(p_phone, '')) > 40
     or char_length(coalesce(p_business_name, '')) > 160
     or char_length(coalesce(p_industry, '')) > 80
     or char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Registration field is too long' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_event_id::text, 0));
  select * into v_event from public.events e where e.id = p_event_id for update;
  if not found or v_event.status <> 'published' or v_event.starts_at <= now() then
    raise exception 'Registration is closed' using errcode = 'P0001';
  end if;
  if v_event.price_cents <> 0 then
    raise exception 'This event requires checkout' using errcode = 'P0001';
  end if;
  if p_quantity < 1 or p_quantity > v_event.max_per_order then
    raise exception 'Invalid guest count' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.event_registrations r
    where r.event_id = p_event_id
      and lower(r.email) = lower(trim(p_email))
      and r.status = 'confirmed'
  ) then
    raise exception 'This email is already registered' using errcode = 'P0001';
  end if;

  select coalesce(sum(r.quantity), 0)::integer into v_taken
  from public.event_registrations r
  where r.event_id = p_event_id
    and (r.status = 'confirmed' or (r.status = 'pending_payment' and r.created_at > now() - interval '35 minutes'));
  if v_event.capacity is not null and v_taken + p_quantity > v_event.capacity then
    raise exception 'Not enough seats remain' using errcode = 'P0001';
  end if;

  return query
  insert into public.event_registrations (
    event_id, user_id, name, email, phone, business_name, industry, notes,
    quantity, amount_cents, status
  ) values (
    p_event_id, (select auth.uid()), trim(p_name), lower(trim(p_email)),
    nullif(trim(p_phone), ''), nullif(trim(p_business_name), ''),
    nullif(trim(p_industry), ''), nullif(trim(p_notes), ''),
    p_quantity, 0, 'confirmed'
  )
  returning event_registrations.id, event_registrations.checkin_code;
end;
$$;

create or replace function public.space_upcoming_blocks(p_space_id uuid)
returns table (starts_at timestamptz, ends_at timestamptz, booking_type text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.starts_at, b.ends_at, b.booking_type
  from public.space_bookings b
  where b.space_id = p_space_id
    and b.status in ('pending_payment', 'confirmed')
    and b.ends_at >= now()
    and exists (select 1 from public.spaces s where s.id = p_space_id and s.active)
  order by b.starts_at
  limit 30
$$;

create or replace function public.request_space_booking(
  p_space_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_business_name text,
  p_notes text,
  p_booking_type text,
  p_starts_at timestamptz,
  p_units integer
)
returns table (booking_id uuid, amount_cents integer, ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_space public.spaces%rowtype;
  v_rate integer;
  v_ends_at timestamptz;
  v_local_start timestamp;
begin
  if nullif(trim(p_name), '') is null or char_length(trim(p_name)) > 120 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;
  if nullif(trim(p_email), '') is null or position('@' in p_email) < 2 or char_length(trim(p_email)) > 200 then
    raise exception 'A valid email is required' using errcode = '22023';
  end if;
  if char_length(coalesce(p_phone, '')) > 40
     or char_length(coalesce(p_business_name, '')) > 160
     or char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Booking field is too long' using errcode = '22023';
  end if;
  if p_starts_at <= now() then
    raise exception 'The booking must start in the future' using errcode = '22023';
  end if;

  select * into v_space from public.spaces s where s.id = p_space_id and s.active;
  if not found then
    raise exception 'Space is unavailable' using errcode = 'P0001';
  end if;

  v_local_start := p_starts_at at time zone 'America/New_York';
  if p_booking_type = 'hourly' then
    if p_units < 1 or p_units > 12 then raise exception 'Invalid hourly term' using errcode = '22023'; end if;
    v_rate := v_space.hourly_rate_cents;
    v_ends_at := p_starts_at + pg_catalog.make_interval(hours => p_units);
    if extract(hour from v_local_start) < 7
       or extract(hour from (v_ends_at at time zone 'America/New_York')) > 22
       or (extract(hour from (v_ends_at at time zone 'America/New_York')) = 22 and extract(minute from (v_ends_at at time zone 'America/New_York')) > 0) then
      raise exception 'Hourly bookings run from 7 AM to 10 PM' using errcode = '22023';
    end if;
  elsif p_booking_type = 'daily' then
    if p_units < 1 or p_units > 30 then raise exception 'Invalid daily term' using errcode = '22023'; end if;
    v_rate := v_space.daily_rate_cents;
    v_ends_at := ((v_local_start::date + p_units)::timestamp at time zone 'America/New_York');
  elsif p_booking_type = 'monthly' then
    if p_units < 1 or p_units > 24 then raise exception 'Invalid monthly term' using errcode = '22023'; end if;
    v_rate := v_space.monthly_rate_cents;
    v_ends_at := ((v_local_start::date + pg_catalog.make_interval(months => p_units))::timestamp at time zone 'America/New_York');
  else
    raise exception 'Invalid booking type' using errcode = '22023';
  end if;
  if v_rate is null then
    raise exception 'That booking option is unavailable' using errcode = 'P0001';
  end if;

  return query
  insert into public.space_bookings (
    space_id, user_id, name, email, phone, business_name, notes,
    booking_type, starts_at, ends_at, amount_cents, status
  ) values (
    p_space_id, (select auth.uid()), trim(p_name), lower(trim(p_email)),
    nullif(trim(p_phone), ''), nullif(trim(p_business_name), ''), nullif(trim(p_notes), ''),
    p_booking_type, p_starts_at, v_ends_at, v_rate * p_units, 'requested'
  )
  returning space_bookings.id, space_bookings.amount_cents, space_bookings.ends_at;
end;
$$;

create or replace function public.submit_venue_inquiry(
  p_name text,
  p_email text,
  p_phone text,
  p_preferred_date date,
  p_package text,
  p_estimated_total_cents integer,
  p_details jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if nullif(trim(p_name), '') is null or char_length(trim(p_name)) > 120 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;
  if nullif(trim(p_email), '') is null or position('@' in p_email) < 2 or char_length(trim(p_email)) > 200 then
    raise exception 'A valid email is required' using errcode = '22023';
  end if;
  if char_length(coalesce(p_phone, '')) > 40
     or char_length(coalesce(p_package, '')) > 200
     or pg_catalog.octet_length(coalesce(p_details, '{}'::jsonb)::text) > 20000 then
    raise exception 'Inquiry field is too long' using errcode = '22023';
  end if;

  insert into public.inquiries (
    kind, name, email, phone, preferred_date, package, estimated_total_cents, details
  ) values (
    'venue', trim(p_name), lower(trim(p_email)), nullif(trim(p_phone), ''),
    p_preferred_date, nullif(trim(p_package), ''),
    case when p_estimated_total_cents between 0 and 100000000 then p_estimated_total_cents else null end,
    coalesce(p_details, '{}'::jsonb)
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Remove PostgreSQL's default function access, then expose only the intended APIs.
revoke execute on function public.get_my_profile() from public, anon, authenticated;
revoke execute on function public.save_my_profile(text, text, text, text, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.event_seats_taken(uuid) from public, anon, authenticated;
revoke execute on function public.register_free_event(uuid, text, text, text, text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.space_upcoming_blocks(uuid) from public, anon, authenticated;
revoke execute on function public.request_space_booking(uuid, text, text, text, text, text, text, timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.submit_venue_inquiry(text, text, text, date, text, integer, jsonb) from public, anon, authenticated;

grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.save_my_profile(text, text, text, text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.event_seats_taken(uuid) to anon, authenticated;
grant execute on function public.register_free_event(uuid, text, text, text, text, text, text, integer) to anon, authenticated;
grant execute on function public.space_upcoming_blocks(uuid) to anon, authenticated;
grant execute on function public.request_space_booking(uuid, text, text, text, text, text, text, timestamptz, integer) to anon, authenticated;
grant execute on function public.submit_venue_inquiry(text, text, text, date, text, integer, jsonb) to anon, authenticated;

-- Launch with useful public inventory while payment processing remains optional.
update public.events
set status = 'published', price_cents = 0,
    summary = 'A welcoming evening of introductions for Fairfax-area owners, founders, and professionals.'
where slug = 'monthly-business-mixer-december-2026';

update public.spaces set active = true where slug in ('private-office', 'dedicated-desk', 'conference-room');
