"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createCheckout } from "@/lib/checkout";
import { serverDataConfigured, stripeConfigured } from "@/lib/config";
import { getPublicEvent, seatsTaken } from "@/lib/data";
import { EMAIL_RE, int, str, type FormState } from "@/lib/forms";
import { longDate, money, timeOfDay } from "@/lib/format";
import { notifyInbox } from "@/lib/notify";
import { adminDb } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";

export async function registerForEvent(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  const event = await getPublicEvent(slug);
  if (!event || event.status !== "published") return { error: "This event is no longer open for registration." };
  if (new Date(event.starts_at).getTime() < Date.now()) return { error: "This event has already started." };
  if (event.price_cents > 0 && (!stripeConfigured || !serverDataConfigured)) return { error: "Online ticket sales open soon. Email info@social-nest.com to reserve a seat." };

  const name = str(form, "name", 120);
  const email = str(form, "email", 200).toLowerCase();
  const quantity = Math.min(Math.max(int(form, "quantity", 1), 1), event.max_per_order);
  if (!name) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };

  if (event.capacity) {
    const left = event.capacity - (await seatsTaken(event.id));
    if (left <= 0) return { error: "This event is full." };
    if (quantity > left) return { error: `Only ${left} ${left === 1 ? "seat is" : "seats are"} left.` };
  }

  const user = await getSessionUser();
  const amount = event.price_cents * quantity;
  if (amount === 0) {
    const sessionDb = await createSessionClient();
    if (!sessionDb) return { error: "Registration is temporarily unavailable. Please try again shortly." };
    const { data, error } = await sessionDb.rpc("register_free_event", {
      p_event_id: event.id,
      p_name: name,
      p_email: email,
      p_phone: str(form, "phone", 40) || null,
      p_business_name: str(form, "business", 160) || null,
      p_industry: str(form, "industry", 80) || null,
      p_notes: str(form, "notes", 1000) || null,
      p_quantity: quantity,
    });
    const registration = Array.isArray(data) ? data[0] : data;
    if (error || !registration) {
      if (error?.message?.includes("already registered")) return { error: "That email is already registered for this event." };
      if (error?.message?.includes("seats")) return { error: "There aren't enough seats left for that group size." };
      return { error: "We couldn't save your registration. Please try again." };
    }
    await notifyInbox(`New RSVP — ${event.title}`, {
      Event: event.title, Date: `${longDate(event.starts_at)} at ${timeOfDay(event.starts_at)}`,
      Name: name, Email: email, Business: str(form, "business"), Guests: quantity,
    });
    return { ok: true, code: registration.checkin_code, message: `You're on the list for ${event.title}.` };
  }

  const db = adminDb();
  const { data: registration, error } = await db.from("event_registrations").insert({
    event_id: event.id,
    user_id: user?.id ?? null,
    name, email, quantity,
    phone: str(form, "phone", 40) || null,
    business_name: str(form, "business", 160) || null,
    industry: str(form, "industry", 80) || null,
    notes: str(form, "notes", 1000) || null,
    amount_cents: amount,
    status: amount > 0 ? "pending_payment" : "confirmed",
  }).select("id, checkin_code").single();
  if (error || !registration) return { error: "We couldn't save your registration. Please try again." };

  let checkoutUrl: string;
  try {
    const checkout = await createCheckout({
      kind: "event", refId: registration.id,
      name: `${event.title} — ticket`,
      description: `${longDate(event.starts_at)} at ${timeOfDay(event.starts_at)} · Social Nest, Fairfax VA · ${money(event.price_cents)} each`,
      unitAmountCents: event.price_cents, quantity, email,
      cancelPath: `/events/${event.slug}`,
    });
    await db.from("event_registrations").update({ stripe_session_id: checkout.id }).eq("id", registration.id);
    checkoutUrl = checkout.url;
  } catch {
    await db.from("event_registrations").update({ status: "cancelled" }).eq("id", registration.id);
    return { error: "Checkout is unavailable right now. Please try again shortly." };
  }
  redirect(checkoutUrl);
}
