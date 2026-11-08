import { money, shortDate, timeOfDay } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

export default async function AdminEvents() {
  const db = adminDb();
  const { data: events } = await db.from("events").select("id, title, slug, starts_at, capacity, price_cents, status, category").order("starts_at", { ascending: false }).limit(200);
  const { data: regs } = await db.from("event_registrations").select("event_id, quantity, checked_in_at, amount_cents").eq("status", "confirmed");
  const stats = new Map<string, { seats: number; checked: number; revenue: number }>();
  (regs || []).forEach((r) => {
    const s = stats.get(r.event_id) || { seats: 0, checked: 0, revenue: 0 };
    s.seats += r.quantity; s.checked += r.checked_in_at ? 1 : 0; s.revenue += r.amount_cents;
    stats.set(r.event_id, s);
  });
  const now = new Date().toISOString();
  return <>
    <div className="admin-title"><div><p className="eyebrow">Events</p><h1>Events & mixers</h1></div><a className="button button-small" href="/admin/events/new">New event</a></div>
    <section className="admin-card">
      {events?.length ? <table className="admin-table"><thead><tr><th>Event</th><th>Status</th><th>Price</th><th>Seats</th><th>Checked in</th><th>Revenue</th></tr></thead><tbody>{events.map((e) => {
        const s = stats.get(e.id) || { seats: 0, checked: 0, revenue: 0 };
        return <tr key={e.id} className={e.starts_at < now ? "is-past" : ""}>
          <td><a href={`/admin/events/${e.id}`}><b>{e.title}</b></a><small>{e.category} · {shortDate(e.starts_at)} · {timeOfDay(e.starts_at)}</small></td>
          <td><span className={`pill pill-${e.status}`}>{e.status}</span></td>
          <td>{money(e.price_cents)}</td>
          <td className="num">{s.seats}{e.capacity ? ` / ${e.capacity}` : ""}</td>
          <td className="num">{s.checked}</td>
          <td className="num">{money(s.revenue, { free: "—" })}</td>
        </tr>;
      })}</tbody></table> : <p className="muted">No events yet.</p>}
    </section>
  </>;
}
