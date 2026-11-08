import { notFound } from "next/navigation";
import { addWalkIn, cancelRegistration, checkInByCode, toggleCheckIn } from "@/app/admin/actions";
import { EventForm, SavedNotice } from "@/components/admin-forms";
import { money, shortDate, timeOfDay } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";
import type { EventRow } from "@/lib/types";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; checkin?: string; q?: string }> };

export default async function AdminEvent({ params, searchParams }: Props) {
  const { id } = await params;
  const { saved, error, checkin, q = "" } = await searchParams;
  const db = adminDb();
  const { data: event } = await db.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();
  const { data: regs } = await db.from("event_registrations").select("*").eq("event_id", id).order("created_at");
  const all = regs || [];
  const confirmed = all.filter((r) => r.status === "confirmed");
  const seats = confirmed.reduce((s, r) => s + r.quantity, 0);
  const checked = confirmed.filter((r) => r.checked_in_at).length;
  const revenue = confirmed.reduce((s, r) => s + r.amount_cents, 0);
  const needle = q.trim().toLowerCase();
  const list = all.filter((r) => r.status !== "cancelled" && (!needle || [r.name, r.email, r.business_name, r.checkin_code].some((v) => v?.toLowerCase().includes(needle))));
  const e = event as EventRow;

  return <>
    <div className="admin-title">
      <div><p className="eyebrow"><a href="/admin/events">Events</a></p><h1>{e.title}</h1><p className="muted">{shortDate(e.starts_at)} · {timeOfDay(e.starts_at)} · <span className={`pill pill-${e.status}`}>{e.status}</span></p></div>
      <div className="admin-actions">{e.status !== "draft" && <a className="text-link" href={`/events/${e.slug}`} target="_blank">View public page</a>}<a className="button button-small" href={`/admin/events/${e.id}/export`}>Export attendees (CSV)</a></div>
    </div>
    <SavedNotice saved={saved} error={error} />
    <section className="kpi-grid kpi-grid-4">
      <div className="kpi"><span>Seats</span><b>{seats}{e.capacity ? ` / ${e.capacity}` : ""}</b><small>{confirmed.length} registrations</small></div>
      <div className="kpi"><span>Checked in</span><b>{checked}</b><small>{confirmed.length ? Math.round((checked / confirmed.length) * 100) : 0}% of registrations</small></div>
      <div className="kpi"><span>Revenue</span><b>{money(revenue, { free: "$0" })}</b><small>{money(e.price_cents)} per ticket</small></div>
      <div className="kpi"><span>Awaiting payment</span><b>{all.filter((r) => r.status === "pending_payment").length}</b><small>holds release after 30 min</small></div>
    </section>

    <section className="admin-card" id="attendees">
      <div className="card-head"><h2>Check-in</h2>
        <form action={checkInByCode} className="inline-form"><input type="hidden" name="event_id" value={e.id} /><input name="code" placeholder="Check-in code" autoComplete="off" /><button className="button button-small" type="submit">Check in</button></form>
      </div>
      {checkin && <p className="notice">{checkin === "none" ? "No unchecked registration matches that code." : `${decodeURIComponent(checkin)} is checked in.`}</p>}
      <form className="inline-form search-form"><input name="q" placeholder="Search name, email, business" defaultValue={q} /><button className="text-link" type="submit">Search</button></form>
      {list.length ? <table className="admin-table"><thead><tr><th>Attendee</th><th>Seats</th><th>Code</th><th>Status</th><th></th></tr></thead><tbody>{list.map((r) => <tr key={r.id} className={r.checked_in_at ? "is-checked" : ""}>
        <td><b>{r.name}</b><small>{[r.business_name, r.industry, r.email, r.phone].filter(Boolean).join(" · ")}</small>{r.notes && <small>Note: {r.notes}</small>}</td>
        <td className="num">{r.quantity}</td>
        <td><code>{r.checkin_code}</code></td>
        <td><span className={`pill pill-${r.status}`}>{r.status.replace("_", " ")}</span></td>
        <td className="row-actions">
          {r.status === "confirmed" && <form action={toggleCheckIn}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="event_id" value={e.id} />{r.checked_in_at ? <><input type="hidden" name="undo" value="1" /><button className="text-link" type="submit">Undo check-in</button></> : <button className="button button-small" type="submit">Check in</button>}</form>}
          <form action={cancelRegistration}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="event_id" value={e.id} /><button className="text-link danger" type="submit">Cancel</button></form>
        </td>
      </tr>)}</tbody></table> : <p className="muted">{needle ? "No matches." : "No registrations yet."}</p>}
      <form action={addWalkIn} className="inline-form walkin-form"><input type="hidden" name="event_id" value={e.id} /><input name="name" placeholder="Walk-in name" required /><input name="email" type="email" placeholder="Email (optional)" /><input name="business" placeholder="Business (optional)" /><button className="text-link" type="submit">Add walk-in</button></form>
    </section>

    <section className="admin-card"><h2>Event details</h2><EventForm event={e} /></section>
  </>;
}
