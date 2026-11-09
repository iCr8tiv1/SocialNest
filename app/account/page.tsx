import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ProfileForm, ReferralForm } from "@/components/account-forms";
import { updateReferral } from "@/app/account/actions";
import { requireUser } from "@/lib/auth";
import { dateTime, longDate, money, timeOfDay } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { nowMs } from "@/lib/time";
import type { ProfileRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account | Social Nest", robots: { index: false } };

type Reg = { id: string; quantity: number; status: string; checkin_code: string; checked_in_at: string | null; amount_cents: number; events: { title: string; slug: string; starts_at: string } | null };
type Booking = { id: string; status: string; booking_type: string; starts_at: string; ends_at: string; amount_cents: number; spaces: { name: string } | null };
type Referral = { id: string; contact_name: string; contact_email: string | null; contact_phone: string | null; notes: string | null; status: string; value_cents: number | null; created_at: string; from_user: string; to_user: string };

const statusLabel: Record<string, string> = { confirmed: "Confirmed", pending_payment: "Awaiting payment", requested: "Requested", cancelled: "Cancelled" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const user = await requireUser("/account");
  const { notice } = await searchParams;
  const db = await createSessionClient();
  if (!db) return <main><SiteHeader /><section className="auth-section"><h1>Accounts are temporarily unavailable.</h1></section><SiteFooter /></main>;
  const [{ data: profile }, { data: regs }, { data: bookings }, { data: referrals }, { data: members }] = await Promise.all([
    db.rpc("get_my_profile").maybeSingle(),
    db.from("event_registrations").select("id, quantity, status, checkin_code, checked_in_at, amount_cents, events(title, slug, starts_at)").neq("status", "cancelled").order("created_at", { ascending: false }).limit(50),
    db.from("space_bookings").select("id, status, booking_type, starts_at, ends_at, amount_cents, spaces(name)").order("starts_at", { ascending: false }).limit(50),
    db.from("referrals").select("*").order("created_at", { ascending: false }).limit(100),
    db.from("profiles").select("id, full_name, business_name").eq("directory_visible", true).neq("id", user.id).not("full_name", "is", null).order("full_name"),
  ]);
  const profileRow = profile as ProfileRow | null;
  const names = new Map((members || []).map((m) => [m.id, m.business_name ? `${m.full_name} · ${m.business_name}` : m.full_name]));
  const sent = ((referrals || []) as Referral[]).filter((r) => r.from_user === user.id);
  const received = ((referrals || []) as Referral[]).filter((r) => r.to_user === user.id);
  const now = nowMs();
  const upcoming = ((regs || []) as unknown as Reg[]).filter((r) => r.events && new Date(r.events.starts_at).getTime() > now - 6 * 3600000);

  return <main>
    <SiteHeader />
    <section className="account-hero">
      <div><p className="eyebrow">Your account</p><h1>Welcome{profileRow?.full_name ? `, ${profileRow.full_name.split(" ")[0]}` : ""}.</h1><p>{user.email}</p></div>
      <div className="account-hero-actions">
        {user.isAdmin && <a className="button" href="/admin">Admin dashboard</a>}
        <form action="/auth/signout" method="post"><button className="text-link" type="submit">Sign out</button></form>
      </div>
    </section>
    {notice === "admin-only" && <p className="notice page-notice">That page is for Social Nest staff. Ask an admin to add your email if you need access.</p>}
    <section className="account-grid">
      <div className="account-card">
        <p className="eyebrow">Upcoming events</p>
        {upcoming.length ? <ul className="row-list">{upcoming.map((r) => <li key={r.id}>
          <div><a href={`/events/${r.events!.slug}`}><b>{r.events!.title}</b></a><span>{longDate(r.events!.starts_at)} · {timeOfDay(r.events!.starts_at)} · {r.quantity} {r.quantity === 1 ? "seat" : "seats"}</span></div>
          <div className="row-end">{r.status === "confirmed" ? <><small>Check-in code</small><strong className="checkin-code">{r.checkin_code}</strong></> : <span className="pill">{statusLabel[r.status]}</span>}</div>
        </li>)}</ul> : <p className="muted">No upcoming events. <a className="text-link" href="/events">Browse the calendar</a></p>}
      </div>
      <div className="account-card">
        <p className="eyebrow">Office bookings</p>
        {bookings?.length ? <ul className="row-list">{(bookings as unknown as Booking[]).map((b) => <li key={b.id}>
          <div><b>{b.spaces?.name}</b><span>{dateTime(b.starts_at)} – {dateTime(b.ends_at)}</span></div>
          <div className="row-end"><span className={`pill pill-${b.status}`}>{statusLabel[b.status]}</span><small>{money(b.amount_cents)}</small></div>
        </li>)}</ul> : <p className="muted">No bookings yet. <a className="text-link" href="/offices">See office space</a></p>}
      </div>
      <div className="account-card account-card-wide">
        <p className="eyebrow">Your directory profile</p>
        <ProfileForm profile={profileRow} />
      </div>
      <div className="account-card">
        <p className="eyebrow">Referrals for you ({received.length})</p>
        {received.length ? <ul className="row-list">{received.map((r) => <li key={r.id} className="referral-row">
          <div><b>{r.contact_name}</b><span>From {names.get(r.from_user) || "a member"} · {[r.contact_email, r.contact_phone].filter(Boolean).join(" · ")}</span>{r.notes && <span>{r.notes}</span>}</div>
          <form action={updateReferral} className="inline-form">
            <input type="hidden" name="id" value={r.id} />
            <select name="status" defaultValue={r.status}><option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option></select>
            <input name="value" placeholder="$ value if won" defaultValue={r.value_cents ? r.value_cents / 100 : ""} />
            <button className="text-link" type="submit">Update</button>
          </form>
        </li>)}</ul> : <p className="muted">When members send you business, it shows up here.</p>}
      </div>
      <div className="account-card">
        <p className="eyebrow">Send a referral</p>
        {profileRow?.directory_visible ? <ReferralForm members={(members || []).map((m) => ({ id: m.id, label: names.get(m.id) as string }))} />
          : <p className="muted">Join the directory (above) to send and receive referrals.</p>}
        {sent.length > 0 && <><p className="eyebrow sub-eyebrow">Sent ({sent.length})</p><ul className="row-list">{sent.map((r) => <li key={r.id}><div><b>{r.contact_name}</b><span>To {names.get(r.to_user) || "a member"}</span></div><span className="pill">{r.status}</span></li>)}</ul></>}
      </div>
    </section>
    <SiteFooter />
  </main>;
}
