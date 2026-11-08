import { money, spaceKindLabel } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

export default async function AdminSpaces() {
  const { data: spaces } = await adminDb().from("spaces").select("*").order("sort_order");
  return <>
    <div className="admin-title"><div><p className="eyebrow">Office space</p><h1>Spaces for rent</h1><p className="muted">Inactive spaces are hidden from the public site. Starter listings were added with placeholder prices — set your real rates before activating them.</p></div><a className="button button-small" href="/admin/spaces/new">New space</a></div>
    <section className="admin-card">
      {spaces?.length ? <table className="admin-table"><thead><tr><th>Space</th><th>Visible</th><th>Hourly</th><th>Daily</th><th>Monthly</th><th>Capacity</th></tr></thead><tbody>{spaces.map((s) => <tr key={s.id}>
        <td><a href={`/admin/spaces/${s.id}`}><b>{s.name}</b></a><small>{spaceKindLabel[s.kind]}</small></td>
        <td><span className={`pill ${s.active ? "pill-confirmed" : "pill-draft"}`}>{s.active ? "Active" : "Hidden"}</span></td>
        <td>{money(s.hourly_rate_cents)}</td><td>{money(s.daily_rate_cents)}</td><td>{money(s.monthly_rate_cents)}</td><td className="num">{s.capacity}</td>
      </tr>)}</tbody></table> : <p className="muted">No spaces yet.</p>}
    </section>
  </>;
}
