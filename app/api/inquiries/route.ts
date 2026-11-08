import { serverDataConfigured } from "@/lib/config";
import { adminDb } from "@/lib/supabase/admin";

// Saves venue rental requests from /book so they appear in the admin dashboard.
// The page still emails info@social-nest.com as before.
export async function POST(request: Request) {
  if (!serverDataConfigured) return Response.json({ saved: false });
  const form = await request.formData();
  const get = (key: string) => (typeof form.get(key) === "string" ? String(form.get(key)).trim().slice(0, 2000) : "");
  const details: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !key.startsWith("_") && Object.keys(details).length < 40) details[key.slice(0, 60)] = value.slice(0, 2000);
  }
  const total = Number(get("Estimated total").replace(/[$,]/g, ""));
  const date = get("preferredDate");
  const { error } = await adminDb().from("inquiries").insert({
    kind: "venue",
    name: get("name") || null,
    email: get("email") || null,
    phone: get("phone") || null,
    preferred_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    package: get("package") || null,
    estimated_total_cents: Number.isFinite(total) && total > 0 ? Math.round(total * 100) : null,
    details,
  });
  return Response.json({ saved: !error });
}
