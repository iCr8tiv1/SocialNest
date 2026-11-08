import { Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fulfillSession } from "@/lib/checkout";
import { dateTime, longDate, money, timeOfDay } from "@/lib/format";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment received | Social Nest", robots: { index: false } };

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const client = stripe();
  let title = "Thank you!";
  let detail = "Your payment was received.";
  let code: string | null = null;

  if (client && session_id?.startsWith("cs_")) {
    try {
      const session = await client.checkout.sessions.retrieve(session_id);
      const result = await fulfillSession(session);
      if (result.fulfilled && result.kind === "event") {
        const { data } = await adminDb().from("event_registrations")
          .select("quantity, checkin_code, events(title, starts_at)").eq("id", result.refId).maybeSingle();
        const event = data?.events as unknown as { title: string; starts_at: string } | null;
        if (data && event) {
          title = `You’re going to ${event.title}.`;
          detail = `${data.quantity} ${data.quantity === 1 ? "ticket" : "tickets"} · ${longDate(event.starts_at)} at ${timeOfDay(event.starts_at)}. A Stripe receipt is on its way to your inbox.`;
          code = data.checkin_code;
        }
      } else if (result.fulfilled && result.kind === "space") {
        const { data } = await adminDb().from("space_bookings")
          .select("starts_at, ends_at, amount_cents, spaces(name)").eq("id", result.refId).maybeSingle();
        const space = data?.spaces as unknown as { name: string } | null;
        if (data && space) {
          title = `${space.name} is booked.`;
          detail = `${dateTime(data.starts_at)} to ${dateTime(data.ends_at)} · ${money(data.amount_cents)} paid. A Stripe receipt is on its way to your inbox.`;
        }
      } else if (session.payment_status !== "paid") {
        title = "Your payment is processing.";
        detail = "We’ll email you as soon as it clears.";
      }
    } catch {
      // Fall back to the generic thank-you; the webhook still confirms the order.
    }
  }

  return <main>
    <SiteHeader />
    <section className="booking-success">
      <span><Check /></span>
      <p className="eyebrow">Confirmed</p>
      <h2>{title}</h2>
      <p>{detail}</p>
      {code && <p>Your check-in code: <strong className="checkin-code">{code}</strong></p>}
      <a className="button" href="/account">View in your account</a>
    </section>
    <SiteFooter />
  </main>;
}
