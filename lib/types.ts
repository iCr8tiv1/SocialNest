export type EventRow = {
  id: string; slug: string; title: string; summary: string | null; description: string | null;
  category: string; starts_at: string; ends_at: string | null; capacity: number | null;
  price_cents: number; max_per_order: number; status: "draft" | "published" | "cancelled";
};
export type SpaceRow = {
  id: string; slug: string; name: string; kind: string; summary: string | null; description: string | null;
  capacity: number; hourly_rate_cents: number | null; daily_rate_cents: number | null;
  monthly_rate_cents: number | null; amenities: string[]; active: boolean; sort_order: number;
};
export type ProfileRow = {
  id: string; email?: string; full_name: string | null; phone?: string | null; business_name: string | null;
  title: string | null; industry: string | null; website: string | null; linkedin: string | null;
  city: string | null; bio: string | null; directory_visible: boolean; created_at: string;
};
