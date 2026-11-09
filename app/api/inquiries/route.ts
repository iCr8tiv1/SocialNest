import { publicDb } from "@/lib/supabase/public";

// Saves venue rental requests from /book so they appear in the admin dashboard.
// The page still emails info@social-nest.com as before.
export async function POST(request: Request) {
  const db = publicDb();
  if (!db) return Response.json({ saved: false }, { status: 503 });
  const form = await request.formData();
  const get = (key: string) => (typeof form.get(key) === "string" ? String(form.get(key)).trim().slice(0, 2000) : "");
  const details: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !key.startsWith("_") && Object.keys(details).length < 40) details[key.slice(0, 60)] = value.slice(0, 2000);
  }
  const total = Number(get("Estimated total").replace(/[$,]/g, ""));
  const date = get("preferredDate");
  const { error } = await db.rpc("submit_venue_inquiry", {
    p_name: get("name"),
    p_email: get("email").toLowerCase(),
    p_phone: get("phone") || null,
    p_preferred_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    p_package: get("package") || null,
    p_estimated_total_cents: Number.isFinite(total) && total > 0 ? Math.round(total * 100) : null,
    p_details: details,
  });
  return Response.json({ saved: !error }, { status: error ? 400 : 200 });
}
