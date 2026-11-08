import { money, shortDate } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const db = adminDb();
  const [{ data: profiles }, { data: regs }, { data: refs }, { data: attendees }] = await Promise.all([
    db.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000),
    db.from("event_registrations").select("user_id, email, checked_in_at").eq("status", "confirmed"),
    db.from("referrals").select("from_user, to_user, status, value_cents"),
    db.from("event_registrations").select("name, email, business_name, industry, created_at").eq("status", "confirmed").is("user_id", null).order("created_at", { ascending: false }).limit(500),
  ]);
  const needle = q.toLowerCase();
  const list = (profiles || []).filter((p) => !needle || [p.full_name, p.email, p.business_name, p.industry].some((v) => v?.toLowerCase().includes(needle)));
  const byKey = (p: { id: string; email: string }) => (regs || []).filter((r) => r.user_id === p.id || r.email === p.email);
  const memberEmails = new Set((profiles || []).map((p) => p.email));
  const guests = new Map<string, { name: string; email: string; business_name: string | null; industry: string | null; count: number; last: string }>();
  (attendees || []).filter((a) => !memberEmails.has(a.email) && !a.email.startsWith("walk-in@")).forEach((a) => {
    const g = guests.get(a.email);
    if (g) g.count++; else guests.set(a.email, { ...a, count: 1, last: a.created_at });
  });

  return <>
    <div className="admin-title"><div><p className="eyebrow">Members</p><h1>Network</h1><p className="muted">{profiles?.length || 0} member accounts · {guests.size} guests who registered without an account</p></div>
      <form className="inline-form"><input name="q" placeholder="Search members" defaultValue={q} /><button className="text-link" type="submit">Search</button></form></div>
    <section className="admin-card">
      <h2>Member accounts</h2>
      {list.length ? <table className="admin-table"><thead><tr><th>Member</th><th>Industry</th><th>Directory</th><th>Events</th><th>Referrals sent / got</th><th>Joined</th></tr></thead><tbody>{list.map((p) => {
        const r = byKey(p);
        const sent = (refs || []).filter((x) => x.from_user === p.id).length;
        const got = (refs || []).filter((x) => x.to_user === p.id);
        const wonValue = got.filter((x) => x.status === "won").reduce((s, x) => s + (x.value_cents || 0), 0);
        return <tr key={p.id}>
          <td><b>{p.full_name || "—"}</b><small>{[p.business_name, p.email, p.phone].filter(Boolean).join(" · ")}</small></td>
          <td>{p.industry || "—"}</td>
          <td><span className={`pill ${p.directory_visible ? "pill-confirmed" : "pill-draft"}`}>{p.directory_visible ? "Listed" : "Private"}</span></td>
          <td className="num">{r.length}<small>{r.filter((x) => x.checked_in_at).length} attended</small></td>
          <td className="num">{sent} / {got.length}{wonValue > 0 && <small>{money(wonValue)} won</small>}</td>
          <td>{shortDate(p.created_at)}</td>
        </tr>;
      })}</tbody></table> : <p className="muted">No members yet.</p>}
    </section>
    {guests.size > 0 && <section className="admin-card">
      <h2>Event guests without accounts</h2>
      <p className="muted small">Good people to invite into the directory.</p>
      <table className="admin-table"><thead><tr><th>Guest</th><th>Industry</th><th>Registrations</th><th>Latest</th></tr></thead><tbody>{[...guests.values()].map((g) => <tr key={g.email}>
        <td><b>{g.name}</b><small>{[g.business_name, g.email].filter(Boolean).join(" · ")}</small></td><td>{g.industry || "—"}</td><td className="num">{g.count}</td><td>{shortDate(g.last)}</td>
      </tr>)}</tbody></table>
    </section>}
  </>;
}
