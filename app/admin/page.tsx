import { etDateKey, longDate, money, shortDate, timeOfDay } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

export default async function AdminOverview() {
  const db = adminDb();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const ninetyAgo = new Date(now.getTime() - 90 * 86400000).toISOString();

  const [payments, upcoming, pastRegs, spaces, monthBookings, requested, inquiries, profiles, referrals, recentRegs] = await Promise.all([
    db.from("payments").select("kind, amount_cents, created_at, status").gte("created_at", sixMonthsAgo.toISOString()),
    db.from("events").select("id, title, slug, starts_at, capacity, price_cents, status").gte("starts_at", now.toISOString()).neq("status", "cancelled").order("starts_at").limit(6),
    db.from("event_registrations").select("quantity, checked_in_at, events!inner(starts_at)").eq("status", "confirmed").gte("events.starts_at", ninetyAgo).lt("events.starts_at", now.toISOString()),
    db.from("spaces").select("id").eq("active", true),
    db.from("space_bookings").select("space_id, starts_at, ends_at").eq("status", "confirmed").lt("starts_at", monthEnd.toISOString()).gt("ends_at", monthStart.toISOString()),
    db.from("space_bookings").select("id", { count: "exact", head: true }).eq("status", "requested"),
    db.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("profiles").select("directory_visible, created_at"),
    db.from("referrals").select("status, value_cents"),
    db.from("event_registrations").select("id, name, business_name, quantity, status, created_at, events(title)").order("created_at", { ascending: false }).limit(8),
  ]);

  const paid = (payments.data || []).filter((p) => p.status === "paid");
  const monthRevenue = paid.filter((p) => p.created_at >= monthStart.toISOString());
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
    const key = d.toISOString().slice(0, 7);
    const rows = paid.filter((p) => p.created_at.slice(0, 7) === key);
    return { label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), events: rows.filter((r) => r.kind === "event").reduce((s, r) => s + r.amount_cents, 0), space: rows.filter((r) => r.kind === "space").reduce((s, r) => s + r.amount_cents, 0) };
  });
  const maxMonth = Math.max(...months.map((m) => m.events + m.space), 1);

  // Seats for upcoming events
  const upcomingIds = (upcoming.data || []).map((e) => e.id);
  const { data: upcomingRegs } = upcomingIds.length
    ? await db.from("event_registrations").select("event_id, quantity").in("event_id", upcomingIds).eq("status", "confirmed")
    : { data: [] as { event_id: string; quantity: number }[] };
  const seats = new Map<string, number>();
  (upcomingRegs || []).forEach((r) => seats.set(r.event_id, (seats.get(r.event_id) || 0) + r.quantity));

  const attended = (pastRegs.data || []).filter((r) => r.checked_in_at).length;
  const registered = (pastRegs.data || []).length;

  // Occupancy: booked space-days this month / available space-days
  const daysInMonth = (monthEnd.getTime() - monthStart.getTime()) / 86400000;
  const bookedDays = new Set<string>();
  (monthBookings.data || []).forEach((b) => {
    for (let t = Math.max(new Date(b.starts_at).getTime(), monthStart.getTime()); t < Math.min(new Date(b.ends_at).getTime(), monthEnd.getTime()); t += 3600000) {
      bookedDays.add(`${b.space_id}:${etDateKey(new Date(t))}`);
    }
  });
  const spaceCount = spaces.data?.length || 0;
  const occupancy = spaceCount ? Math.round((bookedDays.size / (spaceCount * daysInMonth)) * 100) : 0;

  const members = profiles.data || [];
  const newMembers = members.filter((m) => m.created_at >= monthStart.toISOString()).length;
  const won = (referrals.data || []).filter((r) => r.status === "won");

  const kpis = [
    { label: "Revenue this month", value: money(monthRevenue.reduce((s, p) => s + p.amount_cents, 0), { free: "$0" }), sub: `${money(paid.reduce((s, p) => s + p.amount_cents, 0), { free: "$0" })} over 6 months` },
    { label: "Office occupancy", value: `${occupancy}%`, sub: `${spaceCount} active ${spaceCount === 1 ? "space" : "spaces"} · this month` },
    { label: "Event check-in rate", value: registered ? `${Math.round((attended / registered) * 100)}%` : "—", sub: `${attended} of ${registered} registrations · last 90 days` },
    { label: "Members", value: String(members.length), sub: `${members.filter((m) => m.directory_visible).length} in directory · ${newMembers} new this month` },
    { label: "Referrals", value: String(referrals.data?.length || 0), sub: `${won.length} won · ${money(won.reduce((s, r) => s + (r.value_cents || 0), 0), { free: "$0" })} reported` },
    { label: "Needs attention", value: String((requested.count || 0) + (inquiries.count || 0)), sub: `${requested.count || 0} office requests · ${inquiries.count || 0} venue requests` },
  ];

  return <>
    <div className="admin-title"><div><p className="eyebrow">Overview</p><h1>{longDate(now)}</h1></div><a className="button button-small" href="/admin/events/new">New event</a></div>
    <section className="kpi-grid">{kpis.map((k) => <div className="kpi" key={k.label}><span>{k.label}</span><b>{k.value}</b><small>{k.sub}</small></div>)}</section>
    <section className="admin-two">
      <div className="admin-card">
        <h2>Revenue by month</h2>
        <div className="bar-chart" role="img" aria-label="Revenue for the last six months">{months.map((m) => <div key={m.label} className="bar-col">
          <div className="bar-stack" style={{ height: `${((m.events + m.space) / maxMonth) * 100}%` }} title={`${m.label}: ${money(m.events + m.space, { free: "$0" })}`}>
            <i className="bar-space" style={{ flexGrow: m.space }} /><i className="bar-events" style={{ flexGrow: m.events }} />
          </div><small>{m.label}</small></div>)}</div>
        <div className="chart-legend"><span><i className="bar-events" />Event tickets</span><span><i className="bar-space" />Office space</span></div>
      </div>
      <div className="admin-card">
        <h2>Upcoming events</h2>
        {upcoming.data?.length ? <table className="admin-table"><tbody>{upcoming.data.map((e) => <tr key={e.id}>
          <td><a href={`/admin/events/${e.id}`}><b>{e.title}</b></a><small>{shortDate(e.starts_at)} · {timeOfDay(e.starts_at)}{e.status === "draft" ? " · Draft" : ""}</small></td>
          <td className="num">{seats.get(e.id) || 0}{e.capacity ? ` / ${e.capacity}` : ""}<small>seats</small></td>
        </tr>)}</tbody></table> : <p className="muted">No upcoming events. <a className="text-link" href="/admin/events/new">Create one</a></p>}
      </div>
    </section>
    <section className="admin-card">
      <h2>Latest registrations</h2>
      {recentRegs.data?.length ? <table className="admin-table"><thead><tr><th>Name</th><th>Event</th><th>Seats</th><th>Status</th><th>When</th></tr></thead><tbody>{recentRegs.data.map((r) => <tr key={r.id}>
        <td>{r.name}<small>{r.business_name}</small></td><td>{(r.events as unknown as { title: string } | null)?.title}</td><td>{r.quantity}</td><td><span className={`pill pill-${r.status}`}>{r.status.replace("_", " ")}</span></td><td>{shortDate(r.created_at)}</td>
      </tr>)}</tbody></table> : <p className="muted">No registrations yet.</p>}
    </section>
  </>;
}
