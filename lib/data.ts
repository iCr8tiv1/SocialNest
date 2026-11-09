import "server-only";
import { publicDb } from "@/lib/supabase/public";
import type { EventRow, ProfileRow, SpaceRow } from "@/lib/types";

const EVENT_COLS = "id, slug, title, summary, description, category, starts_at, ends_at, capacity, price_cents, max_per_order, status";
const SPACE_COLS = "id, slug, name, kind, summary, description, capacity, hourly_rate_cents, daily_rate_cents, monthly_rate_cents, amenities, active, sort_order";
export const PUBLIC_PROFILE_COLS = "id, full_name, business_name, title, industry, website, linkedin, city, bio, directory_visible, created_at";

/** Published events from 90 days ago onward, for the public calendar. */
export async function listPublicEvents(): Promise<EventRow[]> {
  const db = publicDb();
  if (!db) return [];
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data } = await db.from("events").select(EVENT_COLS)
    .in("status", ["published", "cancelled"]).gte("starts_at", since).order("starts_at");
  return (data as EventRow[]) || [];
}

export async function getPublicEvent(slug: string): Promise<EventRow | null> {
  const db = publicDb();
  if (!db) return null;
  const { data } = await db.from("events").select(EVENT_COLS)
    .eq("slug", slug).in("status", ["published", "cancelled"]).maybeSingle();
  return data as EventRow | null;
}

/** Seats taken by confirmed registrations and unexpired payment holds. */
export async function seatsTaken(eventId: string): Promise<number> {
  const db = publicDb();
  if (!db) return 0;
  const { data } = await db.rpc("event_seats_taken", { p_event_id: eventId });
  return typeof data === "number" ? data : 0;
}

export async function listActiveSpaces(): Promise<SpaceRow[]> {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("spaces").select(SPACE_COLS).eq("active", true).order("sort_order");
  return (data as SpaceRow[]) || [];
}

export async function getActiveSpace(slug: string): Promise<SpaceRow | null> {
  const db = publicDb();
  if (!db) return null;
  const { data } = await db.from("spaces").select(SPACE_COLS).eq("slug", slug).eq("active", true).maybeSingle();
  return data as SpaceRow | null;
}

/** Upcoming held/confirmed time ranges for a space (no personal details). */
export async function upcomingBlocks(spaceId: string) {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.rpc("space_upcoming_blocks", { p_space_id: spaceId });
  return data || [];
}

export async function listDirectory(filters: { q?: string; industry?: string; city?: string; sort?: "business" | "name" | "newest" }): Promise<ProfileRow[]> {
  const db = publicDb();
  if (!db) return [];
  let query = db.from("profiles").select(PUBLIC_PROFILE_COLS).eq("directory_visible", true)
    .not("full_name", "is", null);
  if (filters.industry) query = query.eq("industry", filters.industry);
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, " ").trim();
    if (q) query = query.or(`full_name.ilike.%${q}%,business_name.ilike.%${q}%,bio.ilike.%${q}%,title.ilike.%${q}%,industry.ilike.%${q}%,city.ilike.%${q}%`);
  }
  if (filters.sort === "name") query = query.order("full_name");
  else if (filters.sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("business_name", { nullsFirst: false }).order("full_name");
  const { data } = await query.limit(200);
  return (data as ProfileRow[]) || [];
}

export async function directoryFacets(): Promise<{ industries: string[]; cities: string[] }> {
  const db = publicDb();
  if (!db) return { industries: [], cities: [] };
  const { data } = await db.from("profiles").select("industry, city").eq("directory_visible", true);
  return {
    industries: [...new Set((data || []).map((row) => row.industry as string).filter(Boolean))].sort(),
    cities: [...new Set((data || []).map((row) => row.city as string).filter(Boolean))].sort(),
  };
}
