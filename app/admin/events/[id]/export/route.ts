import { getSessionUser } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return new Response("Not allowed", { status: 403 });
  const { id } = await params;
  const db = adminDb();
  const { data: event } = await db.from("events").select("slug").eq("id", id).maybeSingle();
  const { data } = await db.from("event_registrations").select("name, email, phone, business_name, industry, quantity, amount_cents, status, checkin_code, checked_in_at, notes, created_at").eq("event_id", id).order("created_at");
  const header = ["Name", "Email", "Phone", "Business", "Industry", "Seats", "Paid", "Status", "Code", "Checked in", "Notes", "Registered"];
  const rows = (data || []).map((r) => [r.name, r.email, r.phone, r.business_name, r.industry, r.quantity, (r.amount_cents / 100).toFixed(2), r.status, r.checkin_code, r.checked_in_at || "", r.notes, r.created_at]);
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${event?.slug || "attendees"}.csv"` } });
}
