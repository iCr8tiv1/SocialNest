import type Stripe from "stripe";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/config";
import { fulfillSession, releaseSession } from "@/lib/checkout";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const client = stripe();
  if (!client || !STRIPE_WEBHOOK_SECRET) return new Response("Stripe not configured", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(await request.text(), signature, STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillSession(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await releaseSession(event.data.object);
      break;
  }
  return Response.json({ received: true });
}
