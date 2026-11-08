import "server-only";
import { serverDataConfigured } from "@/lib/config";
import { adminDb } from "@/lib/supabase/admin";
import type { EventRow, ProfileRow, SpaceRow } from "@/lib/types";

const EVENT_COLS = "id, slug, title, summary, description, category, starts_at, ends_at, capacity, price_cents, max_per_order, status";
const SPACE_COLS = "id, slug, name, kind, summary, description, capacity, hourly_rate_cents, daily_rate_cents, monthly_rate_cents, amenities, active, sort_order";
export const PUBLIC_PROFILE_COLS = "id, full_name, business_name, title, industry, website, linkedin, city, bio, directory_visible, created_at";

/** Published events from 90 days ago onward, for the public calendar. */
export async function listPublicEvents(): Promise<EventRow[]> {
  if (!serverDataConfigured) return [];
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data } = await adminDb().from("events").select(EVENT_COLS)
    .in("status", ["published", "cancelled"]).gte("starts_at", since).order("starts_at");
  return (data as EventRow[]) || [];
}

export async function getPublicEvent(slug: string): Promise<EventRow | null> {
  if (!serverDataConfigured) return null;
  const { data } = await adminDb().from("events").select(EVENT_COLS)
    .eq("slug", slug).in("status", ["published", "cancelled"]).maybeSingle();
  return data as EventRow | null;
}

/** Seats taken by confirmed registrations and unexpired payment holds. */
export async function seatsTaken(eventId: string): Promise<number> {
  const holdCutoff = new Date(Date.now() - 35 * 60000).toISOString();
  const { data } = await adminDb().from("event_registrations").select("quantity, status, created_at")
    .eq("event_id", eventId).in("status", ["confirmed", "pending_payment"]);
  return (data || []).reduce((sum, row) =>
    row.status === "confirmed" || row.created_at > holdCutoff ? sum + row.quantity : sum, 0);
}

export async function listActiveSpaces(): Promise<SpaceRow[]> {
  if (!serverDataConfigured) return [];
  const { data } = await adminDb().from("spaces").select(SPACE_COLS).eq("active", true).order("sort_order");
  return (data as SpaceRow[]) || [];
}

export async function getActiveSpace(slug: string): Promise<SpaceRow | null> {
  if (!serverDataConfigured) return null;
  const { data } = await adminDb().from("spaces").select(SPACE_COLS).eq("slug", slug).eq("active", true).maybeSingle();
  return data as SpaceRow | null;
}

/** Upcoming held/confirmed time ranges for a space (no personal details). */
export async function upcomingBlocks(spaceId: string) {
  const { data } = await adminDb().from("space_bookings").select("starts_at, ends_at, booking_type")
    .eq("space_id", spaceId).in("status", ["pending_payment", "confirmed"])
    .gte("ends_at", new Date().toISOString()).order("starts_at").limit(30);
  return data || [];
}

export async function listDirectory(filters: { q?: string; industry?: string }): Promise<ProfileRow[]> {
  if (!serverDataConfigured) return [];
  let query = adminDb().from("profiles").select(PUBLIC_PROFILE_COLS).eq("directory_visible", true)
    .not("full_name", "is", null).order("business_name", { nullsFirst: false });
  if (filters.industry) query = query.eq("industry", filters.industry);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, " ").trim();
    if (q) query = query.or(`full_name.ilike.%${q}%,business_name.ilike.%${q}%,bio.ilike.%${q}%,title.ilike.%${q}%`);
  }
  const { data } = await query.limit(200);
  return (data as ProfileRow[]) || [];
}

export async function directoryIndustries(): Promise<string[]> {
  if (!serverDataConfigured) return [];
  const { data } = await adminDb().from("profiles").select("industry").eq("directory_visible", true).not("industry", "is", null);
  return [...new Set((data || []).map((row) => row.industry as string))].sort();
}
