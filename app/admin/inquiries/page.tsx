import { setInquiryStatus } from "@/app/admin/actions";
import { money, shortDate } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

const hidden = new Set(["name", "email", "phone", "package", "preferredDate", "Estimated total"]);

export default async function AdminInquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "new" } = await searchParams;
  let query = adminDb().from("inquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") query = query.eq("status", status);
  const { data: rows } = await query;
  return <>
    <div className="admin-title"><div><p className="eyebrow">Venue requests</p><h1>Requests from “Book the Nest”</h1><p className="muted">These also arrive by email at info@social-nest.com.</p></div></div>
    <nav className="admin-tabs">{["new", "contacted", "booked", "closed", "all"].map((s) => <a key={s} href={`/admin/inquiries?status=${s}`} aria-current={status === s ? "page" : undefined}>{s[0].toUpperCase() + s.slice(1)}</a>)}</nav>
    <section className="admin-card">
      {rows?.length ? <table className="admin-table"><thead><tr><th>Contact</th><th>Request</th><th>Estimate</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}>
        <td><b>{r.name}</b><small>{[r.email, r.phone].filter(Boolean).join(" · ")}</small><small>Received {shortDate(r.created_at)}</small></td>
        <td><b>{r.package || "Venue rental"}</b><small>{r.preferred_date ? `Preferred ${shortDate(`${r.preferred_date}T12:00:00Z`)}` : ""}</small>
          <details><summary>Details</summary><dl className="detail-dl">{Object.entries((r.details || {}) as Record<string, string>).filter(([k]) => !hidden.has(k)).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details></td>
        <td className="num">{money(r.estimated_total_cents)}</td>
        <td><form action={setInquiryStatus} className="inline-form"><input type="hidden" name="id" value={r.id} /><select name="status" defaultValue={r.status}><option value="new">New</option><option value="contacted">Contacted</option><option value="booked">Booked</option><option value="closed">Closed</option></select><button className="text-link" type="submit">Update</button></form></td>
      </tr>)}</tbody></table> : <p className="muted">No requests here.</p>}
    </section>
  </>;
}
