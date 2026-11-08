"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { centsFrom, int, str } from "@/lib/forms";
import { etToIso, slugify } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

function localToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  return etToIso(value.slice(0, 10), value.slice(11, 16));
}

async function uniqueSlug(table: "events" | "spaces", base: string, id?: string) {
  const db = adminDb();
  let slug = base, n = 1;
  for (;;) {
    const { data } = await db.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === id) return slug;
    slug = `${base}-${++n}`;
  }
}

export async function saveEvent(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 60) || undefined;
  const title = str(form, "title", 160);
  const startsAt = localToIso(str(form, "starts_at", 20));
  if (!title || !startsAt) redirect(`/admin/events/${id || "new"}?error=missing`);
  const endsAt = localToIso(str(form, "ends_at", 20));
  const date = startsAt.slice(0, 7);
  const slug = await uniqueSlug("events", slugify(str(form, "slug", 80) || `${title}-${date}`), id);
  const capacity = int(form, "capacity", 0);
  const values = {
    title, slug,
    summary: str(form, "summary", 300) || null,
    description: str(form, "description", 6000) || null,
    category: str(form, "category", 60) || "Networking",
    starts_at: startsAt,
    ends_at: endsAt && endsAt > startsAt ? endsAt : null,
    capacity: capacity > 0 ? capacity : null,
    price_cents: centsFrom(form, "price") ?? 0,
    max_per_order: Math.min(Math.max(int(form, "max_per_order", 4), 1), 20),
    status: ["draft", "published", "cancelled"].includes(str(form, "status")) ? str(form, "status") : "draft",
  };
  const db = adminDb();
  const result = id ? await db.from("events").update(values).eq("id", id).select("id").single()
    : await db.from("events").insert(values).select("id").single();
  if (result.error) redirect(`/admin/events/${id || "new"}?error=save`);
  revalidatePath("/events");
  revalidatePath("/network");
  redirect(`/admin/events/${result.data.id}?saved=1`);
}

export async function toggleCheckIn(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 60);
  const eventId = str(form, "event_id", 60);
  const undo = form.get("undo") === "1";
  await adminDb().from("event_registrations").update({ checked_in_at: undo ? null : new Date().toISOString() }).eq("id", id);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function checkInByCode(form: FormData) {
  await requireAdmin();
  const eventId = str(form, "event_id", 60);
  const code = str(form, "code", 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const { data } = await adminDb().from("event_registrations").update({ checked_in_at: new Date().toISOString() })
    .eq("event_id", eventId).eq("checkin_code", code).eq("status", "confirmed").is("checked_in_at", null).select("name").maybeSingle();
  redirect(`/admin/events/${eventId}?checkin=${data ? encodeURIComponent(data.name) : "none"}#attendees`);
}

export async function addWalkIn(form: FormData) {
  await requireAdmin();
  const eventId = str(form, "event_id", 60);
  const name = str(form, "name", 120);
  if (name) {
    await adminDb().from("event_registrations").insert({
      event_id: eventId, name, email: str(form, "email", 200).toLowerCase() || "walk-in@social-nest.com",
      business_name: str(form, "business", 160) || null, quantity: 1, status: "confirmed",
      checked_in_at: new Date().toISOString(), notes: "Walk-in",
    });
  }
  revalidatePath(`/admin/events/${eventId}`);
}

export async function cancelRegistration(form: FormData) {
  await requireAdmin();
  const eventId = str(form, "event_id", 60);
  await adminDb().from("event_registrations").update({ status: "cancelled" }).eq("id", str(form, "id", 60));
  revalidatePath(`/admin/events/${eventId}`);
}

export async function saveSpace(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 60) || undefined;
  const name = str(form, "name", 120);
  if (!name) redirect(`/admin/spaces/${id || "new"}?error=missing`);
  const values = {
    name,
    slug: await uniqueSlug("spaces", slugify(str(form, "slug", 80) || name), id),
    kind: ["private_office", "dedicated_desk", "hot_desk", "meeting_room"].includes(str(form, "kind")) ? str(form, "kind") : "private_office",
    summary: str(form, "summary", 300) || null,
    description: str(form, "description", 4000) || null,
    capacity: Math.max(int(form, "capacity", 1), 1),
    hourly_rate_cents: centsFrom(form, "hourly"),
    daily_rate_cents: centsFrom(form, "daily"),
    monthly_rate_cents: centsFrom(form, "monthly"),
    amenities: str(form, "amenities", 1000).split(",").map((a) => a.trim()).filter(Boolean).slice(0, 20),
    active: form.get("active") === "on",
    sort_order: int(form, "sort_order", 0),
  };
  const db = adminDb();
  const result = id ? await db.from("spaces").update(values).eq("id", id).select("id").single()
    : await db.from("spaces").insert(values).select("id").single();
  if (result.error) redirect(`/admin/spaces/${id || "new"}?error=save`);
  revalidatePath("/offices");
  redirect(`/admin/spaces/${result.data.id}?saved=1`);
}

export async function setBookingStatus(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 60);
  const status = str(form, "status", 20);
  if (!["requested", "confirmed", "cancelled"].includes(status)) return;
  const { error } = await adminDb().from("space_bookings").update({ status, admin_notes: str(form, "admin_notes", 1000) || null }).eq("id", id);
  revalidatePath("/admin/bookings");
  if (error?.code === "23P01") redirect("/admin/bookings?error=overlap");
}

export async function setInquiryStatus(form: FormData) {
  await requireAdmin();
  const status = str(form, "status", 20);
  if (!["new", "contacted", "booked", "closed"].includes(status)) return;
  await adminDb().from("inquiries").update({ status }).eq("id", str(form, "id", 60));
  revalidatePath("/admin/inquiries");
}
