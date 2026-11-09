"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createCheckout } from "@/lib/checkout";
import { serverDataConfigured, stripeConfigured } from "@/lib/config";
import { getActiveSpace } from "@/lib/data";
import { EMAIL_RE, int, str, type FormState } from "@/lib/forms";
import { dateTime, etToIso, money } from "@/lib/format";
import { notifyInbox } from "@/lib/notify";
import { adminDb } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function addMonths(date: string, months: number) {
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export async function requestBooking(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  const space = await getActiveSpace(slug);
  if (!space) return { error: "This space is no longer available." };

  const type = str(form, "type", 10) as "hourly" | "daily" | "monthly";
  const date = str(form, "date", 10);
  const name = str(form, "name", 120);
  const email = str(form, "email", 200).toLowerCase();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Please choose a start date." };
  if (!name) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };

  let startsAt: string, endsAt: string, units: number, unitLabel: string, rate: number | null;
  if (type === "hourly") {
    rate = space.hourly_rate_cents;
    const time = str(form, "time", 5);
    units = Math.min(Math.max(int(form, "hours", 1), 1), 12);
    if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Please choose a start time." };
    const [h, m] = time.split(":").map(Number);
    if (h < 7 || h + m / 60 + units > 22) return { error: "Hourly bookings run between 7 AM and 10 PM." };
    startsAt = etToIso(date, time);
    endsAt = new Date(new Date(startsAt).getTime() + units * 3600000).toISOString();
    unitLabel = units === 1 ? "hour" : "hours";
  } else if (type === "daily") {
    rate = space.daily_rate_cents;
    units = Math.min(Math.max(int(form, "days", 1), 1), 30);
    startsAt = etToIso(date);
    endsAt = etToIso(addDays(date, units));
    unitLabel = units === 1 ? "day" : "days";
  } else if (type === "monthly") {
    rate = space.monthly_rate_cents;
    units = Math.min(Math.max(int(form, "months", 1), 1), 24);
    startsAt = etToIso(date);
    endsAt = etToIso(addMonths(date, units));
    unitLabel = units === 1 ? "month" : "months";
  } else {
    return { error: "Please choose how you'd like to book." };
  }
  if (rate == null) return { error: "That booking option isn't offered for this space." };
  if (new Date(startsAt).getTime() < Date.now()) return { error: "Please choose a date and time in the future." };
  const amount = rate * units;

  // Monthly terms need an agreement, so they're always reviewed first.
  const payNow = type !== "monthly" && stripeConfigured && serverDataConfigured && amount > 0;
  if (!payNow) {
    const sessionDb = await createSessionClient();
    if (!sessionDb) return { error: "Booking requests are temporarily unavailable. Please try again shortly." };
    const { data, error } = await sessionDb.rpc("request_space_booking", {
      p_space_id: space.id,
      p_name: name,
      p_email: email,
      p_phone: str(form, "phone", 40) || null,
      p_business_name: str(form, "business", 160) || null,
      p_notes: str(form, "notes", 1000) || null,
      p_booking_type: type,
      p_starts_at: startsAt,
      p_units: units,
    });
    const booking = Array.isArray(data) ? data[0] : data;
    if (error || !booking) return { error: "We couldn't save your request. Please try again." };
    await notifyInbox(`Office space request — ${space.name}`, {
      Space: space.name, Term: `${units} ${unitLabel} (${type})`,
      Starts: dateTime(startsAt), Ends: dateTime(booking.ends_at || endsAt), Estimate: money(booking.amount_cents ?? amount),
      Name: name, Email: email, Phone: str(form, "phone"), Business: str(form, "business"), Notes: str(form, "notes"),
    });
    return { ok: true, message: `Request received for ${space.name}. We'll confirm availability and next steps by email.` };
  }

  const db = adminDb();
  const { data: clash } = await db.from("space_bookings").select("id")
    .eq("space_id", space.id).in("status", ["pending_payment", "confirmed"])
    .lt("starts_at", endsAt).gt("ends_at", startsAt).limit(1);
  if (clash?.length) return { error: "That time is already booked. Please choose another time." };

  const user = await getSessionUser();
  const { data: booking, error } = await db.from("space_bookings").insert({
    space_id: space.id, user_id: user?.id ?? null, name, email,
    phone: str(form, "phone", 40) || null,
    business_name: str(form, "business", 160) || null,
    notes: str(form, "notes", 1000) || null,
    booking_type: type, starts_at: startsAt, ends_at: endsAt, amount_cents: amount,
    status: payNow ? "pending_payment" : "requested",
  }).select("id").single();
  if (error?.code === "23P01") return { error: "That time was just booked. Please choose another time." };
  if (error || !booking) return { error: "We couldn't save your request. Please try again." };

  let checkoutUrl: string;
  try {
    const checkout = await createCheckout({
      kind: "space", refId: booking.id, name: `${space.name} — ${units} ${unitLabel}`,
      description: `${dateTime(startsAt)} to ${dateTime(endsAt)} · Social Nest, Fairfax VA`,
      unitAmountCents: amount, quantity: 1, email, cancelPath: `/offices/${space.slug}`,
    });
    await db.from("space_bookings").update({ stripe_session_id: checkout.id }).eq("id", booking.id);
    checkoutUrl = checkout.url;
  } catch {
    await db.from("space_bookings").update({ status: "cancelled" }).eq("id", booking.id);
    return { error: "Checkout is unavailable right now. Please try again shortly." };
  }
  redirect(checkoutUrl);
}
