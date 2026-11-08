import "server-only";
import type Stripe from "stripe";
import { SITE_URL } from "@/lib/config";
import { notifyInbox } from "@/lib/notify";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/supabase/admin";
import { money } from "@/lib/format";

type CheckoutInput = {
  kind: "event" | "space";
  refId: string;
  name: string;
  description: string;
  unitAmountCents: number;
  quantity: number;
  email: string;
  cancelPath: string;
};

/** Create a Stripe Checkout session; returns its URL and id. */
export async function createCheckout(input: CheckoutInput) {
  const client = stripe();
  if (!client) throw new Error("Stripe is not configured");
  const session = await client.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: [{
      quantity: input.quantity,
      price_data: {
        currency: "usd",
        unit_amount: input.unitAmountCents,
        product_data: { name: input.name, description: input.description.slice(0, 500) || undefined },
      },
    }],
    metadata: { kind: input.kind, ref_id: input.refId },
    payment_intent_data: { metadata: { kind: input.kind, ref_id: input.refId } },
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}${input.cancelPath}${input.cancelPath.includes("?") ? "&" : "?"}checkout=cancelled`,
  });
  return { id: session.id, url: session.url! };
}

/**
 * Mark the registration or booking behind a paid session as confirmed.
 * Safe to call repeatedly (webhook and success page both call it).
 */
export async function fulfillSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return { fulfilled: false as const };
  const kind = session.metadata?.kind as "event" | "space" | undefined;
  const refId = session.metadata?.ref_id;
  if (!kind || !refId) return { fulfilled: false as const };
  const db = adminDb();
  const table = kind === "event" ? "event_registrations" : "space_bookings";

  const { data: updated } = await db.from(table)
    .update({ status: "confirmed" })
    .eq("id", refId).eq("stripe_session_id", session.id).neq("status", "confirmed")
    .select("id, name, email").maybeSingle();

  await db.from("payments").upsert({
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
    kind, ref_id: refId,
    email: session.customer_details?.email || session.customer_email,
    amount_cents: session.amount_total ?? 0,
  }, { onConflict: "stripe_session_id", ignoreDuplicates: true });

  if (updated) {
    await notifyInbox(kind === "event" ? "Paid event registration — Social Nest" : "Paid office booking — Social Nest", {
      Type: kind === "event" ? "Event ticket" : "Office space",
      Name: updated.name, Email: updated.email, Amount: money(session.amount_total ?? 0),
      "Stripe session": session.id,
    });
  }
  return { fulfilled: true as const, kind, refId };
}

/** Release a payment hold when a Checkout session expires unpaid. */
export async function releaseSession(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  const refId = session.metadata?.ref_id;
  if (!kind || !refId) return;
  const table = kind === "event" ? "event_registrations" : "space_bookings";
  await adminDb().from(table).update({ status: "cancelled" })
    .eq("id", refId).eq("stripe_session_id", session.id).eq("status", "pending_payment");
}
