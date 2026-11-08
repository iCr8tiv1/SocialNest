# Social Nest

The website and member platform for [Social Nest](https://social-nest.com) — a private venue and shared office in Fairfax, VA.

Built with Next.js (App Router), Supabase (Postgres + email sign-in) and Stripe Checkout, deployed on Vercel.

## What's here

| Area | Pages | Notes |
| --- | --- | --- |
| Venue marketing | `/`, `/space`, `/amenities`, `/gallery`, `/tour`, `/faq`, `/policies`, `/privacy` | Unchanged from the original site |
| Venue rental requests | `/book` | Emails info@social-nest.com (FormSubmit) **and** saves to `inquiries` |
| Events & mixers | `/events`, `/events/[slug]` | Calendar from the database; free RSVP or paid tickets via Stripe; check-in codes |
| Business network | `/network` | Monthly mixers, public member directory with search/industry filter |
| Office space | `/offices`, `/offices/[slug]` | Hourly/daily bookings paid via Stripe; monthly terms are requests |
| Members | `/login`, `/account` | Email magic-link sign-in, profile & directory opt-in, tickets, bookings, referrals |
| Admin | `/admin/*` | KPIs, events + attendee check-in + CSV export, spaces, bookings, members, venue requests |

## Environment variables

Set these in Vercel (Project → Settings → Environment Variables):

| Name | Where to find it | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://social-nest.com` (or the preview URL) | no |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | no |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API keys → publishable (or legacy anon) key | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API keys → secret / service_role key | **yes** |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_live_…` / `sk_test_…`) | **yes** |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → endpoint signing secret (`whsec_…`) | **yes** |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` (default `info@social-nest.com`) | no |
| `NOTIFY_EMAIL` | Inbox for new-booking notifications (default `info@social-nest.com`) | no |

Without Stripe keys the site still works: free events take RSVPs, paid events show "tickets on sale soon", and office bookings come in as requests.

## Setup

1. **Database** — run `supabase/migrations/20261108000000_platform.sql` in the Supabase SQL Editor (or `supabase db push`). It creates the tables, security rules, and a draft mixer plus three hidden starter office listings with placeholder prices.
2. **Auth** — Supabase → Authentication → URL Configuration: set Site URL to your domain and add `https://social-nest.com/auth/callback` (and your preview URL) to Redirect URLs. For reliable sign-in emails, add custom SMTP (Authentication → Emails → SMTP) — Supabase's built-in sender is rate-limited.
3. **Stripe webhook** — add an endpoint `https://social-nest.com/api/stripe/webhook` with events `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
4. **Admin access** — sign in at `/login` with an email listed in `ADMIN_EMAILS`, then open `/admin`.

## Develop

```sh
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev
```
