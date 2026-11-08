-- Social Nest platform: networking events, member directory, referrals,
-- office space rental, Stripe payments, and venue inquiries.
--
-- Access model
--   * Public pages read published events, active spaces and opted-in directory
--     profiles through the publishable key, limited by RLS and column grants.
--   * Every write (registrations, bookings, referrals, admin edits) goes through
--     the Next.js server, which validates input, computes prices and uses the
--     service-role key. Clients never write these tables directly.

create extension if not exists btree_gist;

-- Members ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  business_name text,
  title text,
  industry text,
  website text,
  linkedin text,
  city text,
  bio text,
  directory_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Events ----------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  category text not null default 'Networking',
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  max_per_order integer not null default 4 check (max_per_order between 1 and 20),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_starts_at_idx on public.events (starts_at);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  business_name text,
  industry text,
  notes text,
  quantity integer not null default 1 check (quantity between 1 and 20),
  amount_cents integer not null default 0,
  status text not null default 'confirmed'
    check (status in ('pending_payment', 'confirmed', 'cancelled')),
  stripe_session_id text unique,
  checkin_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
create index event_registrations_event_idx on public.event_registrations (event_id);
create index event_registrations_user_idx on public.event_registrations (user_id);
create index event_registrations_email_idx on public.event_registrations (lower(email));

-- Office space ------------------------------------------------------------------
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'private_office'
    check (kind in ('private_office', 'dedicated_desk', 'hot_desk', 'meeting_room')),
  summary text,
  description text,
  capacity integer not null default 1 check (capacity > 0),
  hourly_rate_cents integer check (hourly_rate_cents is null or hourly_rate_cents >= 0),
  daily_rate_cents integer check (daily_rate_cents is null or daily_rate_cents >= 0),
  monthly_rate_cents integer check (monthly_rate_cents is null or monthly_rate_cents >= 0),
  amenities text[] not null default '{}',
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.space_bookings (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  business_name text,
  notes text,
  booking_type text not null check (booking_type in ('hourly', 'daily', 'monthly')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  amount_cents integer not null default 0,
  status text not null default 'requested'
    check (status in ('requested', 'pending_payment', 'confirmed', 'cancelled')),
  stripe_session_id text unique,
  admin_notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- No two held or confirmed bookings may overlap for the same space.
  constraint space_bookings_no_overlap exclude using gist (
    space_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending_payment', 'confirmed'))
);
create index space_bookings_space_idx on public.space_bookings (space_id, starts_at);
create index space_bookings_user_idx on public.space_bookings (user_id);

-- Referrals between members -----------------------------------------------------
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  contact_name text not null,
  contact_email text,
  contact_phone text,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  value_cents integer check (value_cents is null or value_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index referrals_from_idx on public.referrals (from_user);
create index referrals_to_idx on public.referrals (to_user);

-- Payments ledger (written by the Stripe webhook / success page) -----------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  kind text not null check (kind in ('event', 'space')),
  ref_id uuid not null,
  email text,
  amount_cents integer not null,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now()
);
create index payments_created_idx on public.payments (created_at);

-- Venue rental inquiries from /book ----------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'venue',
  name text,
  email text,
  phone text,
  preferred_date date,
  package text,
  estimated_total_cents integer,
  details jsonb not null default '{}',
  status text not null default 'new' check (status in ('new', 'contacted', 'booked', 'closed')),
  created_at timestamptz not null default now()
);

-- updated_at maintenance ---------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
create trigger spaces_touch before update on public.spaces
  for each row execute function public.touch_updated_at();
create trigger referrals_touch before update on public.referrals
  for each row execute function public.touch_updated_at();

-- Row level security -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.spaces enable row level security;
alter table public.space_bookings enable row level security;
alter table public.referrals enable row level security;
alter table public.payments enable row level security;
alter table public.inquiries enable row level security;

-- Public read of published events and active spaces.
create policy "Published events are public" on public.events
  for select to anon, authenticated using (status in ('published', 'cancelled'));
create policy "Active spaces are public" on public.spaces
  for select to anon, authenticated using (active);

-- Directory: opted-in profiles are visible to everyone, but only through the
-- public columns granted below (no email or phone).
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, business_name, title, industry, website, linkedin, city, bio, directory_visible, created_at)
  on public.profiles to anon, authenticated;
create policy "Directory profiles are public" on public.profiles
  for select to anon, authenticated using (directory_visible or id = (select auth.uid()));

-- Nothing else is readable or writable with the publishable key. Registrations,
-- bookings, referrals, payments and inquiries are served by the Next.js server.
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- Starter records (inactive / draft — edit in the admin dashboard before publishing)
insert into public.events (slug, title, summary, description, category, starts_at, ends_at, capacity, price_cents, status)
values (
  'monthly-business-mixer-december-2026',
  'Monthly Business Mixer',
  'An open evening of introductions for small and mid-size business owners.',
  'Meet local owners, founders and professionals over light refreshments. Bring business cards and a 30-second introduction — every attendee gets a chance to share what they do and who they want to meet.',
  'Networking',
  '2026-12-10 18:00:00-05', '2026-12-10 20:00:00-05', 40, 1500, 'draft'
);

insert into public.spaces (slug, name, kind, summary, capacity, hourly_rate_cents, daily_rate_cents, monthly_rate_cents, amenities, sort_order)
values
  ('private-office', 'Private Office', 'private_office',
   'A lockable office for a small team, available by the day or month.', 2, null, 7500, 65000,
   array['Wi-Fi', 'Desk & chairs', 'Lockable door', 'Mail handling'], 1),
  ('dedicated-desk', 'Dedicated Desk', 'dedicated_desk',
   'Your own desk in the shared area, ready whenever you are.', 1, null, 3500, 30000,
   array['Wi-Fi', 'Storage drawer', 'Coffee'], 2),
  ('conference-room', 'Conference Room', 'meeting_room',
   'A meeting room with a display for client calls and small team sessions.', 8, 4000, 25000, null,
   array['Wi-Fi', 'Presentation display', 'Whiteboard'], 3);
