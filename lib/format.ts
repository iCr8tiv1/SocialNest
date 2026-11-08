import { TIME_ZONE } from "@/lib/config";

export function money(cents: number | null | undefined, { free = "Free" } = {}) {
  if (cents == null) return "—";
  if (cents === 0) return free;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

const fmt = (options: Intl.DateTimeFormatOptions) => (value: string | Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, ...options }).format(new Date(value));

export const longDate = fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
export const shortDate = fmt({ month: "short", day: "numeric", year: "numeric" });
export const timeOfDay = fmt({ hour: "numeric", minute: "2-digit" });
export const dayNumber = fmt({ day: "2-digit" });
export const monthShort = fmt({ month: "short" });
export const dateTime = fmt({ month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** YYYY-MM-DD for a moment, in Eastern Time. */
export function etDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Offset string such as -05:00 for a given ET wall-clock date. */
function etOffset(date: string) {
  const probe = new Date(`${date}T12:00:00Z`);
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName")?.value || "GMT-05:00";
  const match = name.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return match ? `${match[1]}:${match[2] || "00"}` : "-05:00";
}

/** Convert an Eastern Time wall-clock date + time to an ISO timestamp. */
export function etToIso(date: string, time = "00:00") {
  return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}${etOffset(date)}`).toISOString();
}

/** ISO timestamp -> value for <input type="datetime-local"> in Eastern Time. */
export function isoToEtLocal(value: string | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 80) || "item";
}

export const spaceKindLabel: Record<string, string> = {
  private_office: "Private office",
  dedicated_desk: "Dedicated desk",
  hot_desk: "Hot desk",
  meeting_room: "Meeting room",
};
