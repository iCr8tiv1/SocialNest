import { setBookingStatus } from "@/app/admin/actions";
import { dateTime, money, shortDate } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

const tabs = [["requested", "Requests"], ["upcoming", "Upcoming"], ["pending_payment", "Awaiting payment"], ["past", "Past"], ["cancelled", "Cancelled"]] as const;

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  const { tab = "requested", error } = await searchParams;
  const now = new Date().toISOString();
  let query = adminDb().from("space_bookings").select("*, spaces(name)");
  if (tab === "upcoming") query = query.eq("status", "confirmed").gte("ends_at", now).order("starts_at");
  else if (tab === "past") query = query.eq("status", "confirmed").lt("ends_at", now).order("starts_at", { ascending: false });
  else query = query.eq("status", tab).order("starts_at");
  const { data: bookings } = await query.limit(200);

  return <>
    <div className="admin-title"><div><p className="eyebrow">Bookings</p><h1>Office bookings</h1></div></div>
    <nav className="admin-tabs">{tabs.map(([key, label]) => <a key={key} href={`/admin/bookings?tab=${key}`} aria-current={tab === key ? "page" : undefined}>{label}</a>)}</nav>
    {error === "overlap" && <p className="notice notice-error">That booking overlaps one that’s already confirmed for the same space.</p>}
    <section className="admin-card">
      {bookings?.length ? <table className="admin-table"><thead><tr><th>Renter</th><th>Space & time</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{bookings.map((b) => <tr key={b.id}>
        <td><b>{b.name}</b><small>{[b.business_name, b.email, b.phone].filter(Boolean).join(" · ")}</small>{b.notes && <small>Note: {b.notes}</small>}<small>Requested {shortDate(b.created_at)}</small></td>
        <td><b>{(b.spaces as { name: string } | null)?.name}</b><small>{b.booking_type} · {dateTime(b.starts_at)} – {dateTime(b.ends_at)}</small></td>
        <td className="num">{money(b.amount_cents)}<small>{b.stripe_session_id && b.status === "confirmed" ? "Paid online" : b.booking_type === "monthly" ? "Invoice" : ""}</small></td>
        <td><span className={`pill pill-${b.status}`}>{b.status.replace("_", " ")}</span></td>
        <td><form action={setBookingStatus} className="stack-form">
          <input type="hidden" name="id" value={b.id} />
          <input name="admin_notes" placeholder="Internal note" defaultValue={b.admin_notes || ""} />
          <div className="row-actions">
            {b.status !== "confirmed" && <button className="button button-small" name="status" value="confirmed">Confirm</button>}
            {b.status !== "cancelled" && <button className="text-link danger" name="status" value="cancelled">Cancel</button>}
            {b.status === "cancelled" && <button className="text-link" name="status" value="requested">Reopen</button>}
          </div>
        </form></td>
      </tr>)}</tbody></table> : <p className="muted">Nothing here.</p>}
    </section>
    <p className="muted small">Confirming an offline booking marks the time as taken. Collect payment for monthly terms with your usual invoice — online refunds are issued from the Stripe dashboard.</p>
  </>;
}
