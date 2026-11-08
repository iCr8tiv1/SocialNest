import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, MapPin, Ticket, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { RegisterForm } from "@/components/register-form";
import { getSessionUser } from "@/lib/auth";
import { stripeConfigured } from "@/lib/config";
import { getPublicEvent, seatsTaken } from "@/lib/data";
import { longDate, money, timeOfDay } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";
import { nowMs } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getPublicEvent((await params).slug);
  return event
    ? { title: `${event.title} | Social Nest`, description: event.summary || `${event.title} at Social Nest in Fairfax, Virginia.` }
    : { title: "Event | Social Nest" };
}

export default async function EventPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { checkout } = await searchParams;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const taken = await seatsTaken(event.id);
  const left = event.capacity ? Math.max(event.capacity - taken, 0) : null;
  const past = new Date(event.starts_at).getTime() < nowMs();
  const user = await getSessionUser();
  let prefill: { name?: string; email?: string; business?: string; industry?: string; phone?: string } = {};
  if (user) {
    const { data } = await adminDb().from("profiles").select("full_name, email, business_name, industry, phone").eq("id", user.id).maybeSingle();
    prefill = { name: data?.full_name || "", email: data?.email || user.email, business: data?.business_name || "", industry: data?.industry || "", phone: data?.phone || "" };
  }

  let closedReason = "";
  if (event.status === "cancelled") closedReason = "This event has been cancelled.";
  else if (past) closedReason = "This event has already taken place.";
  else if (left === 0) closedReason = "This event is full.";
  else if (event.price_cents > 0 && !stripeConfigured) closedReason = "Online ticket sales open soon. Email info@social-nest.com to reserve a seat.";

  return <main>
    <SiteHeader />
    <section className="detail-hero">
      <div>
        <p className="eyebrow">{event.category}{event.status === "cancelled" ? " · Cancelled" : ""}</p>
        <h1>{event.title}</h1>
        {event.summary && <p className="detail-lede">{event.summary}</p>}
      </div>
      <dl className="detail-facts">
        <div><dt><CalendarDays aria-hidden="true" />Date</dt><dd>{longDate(event.starts_at)}</dd></div>
        <div><dt><Clock3 aria-hidden="true" />Time</dt><dd>{timeOfDay(event.starts_at)}{event.ends_at ? ` – ${timeOfDay(event.ends_at)}` : ""} ET</dd></div>
        <div><dt><MapPin aria-hidden="true" />Where</dt><dd>Social Nest · 10301 Democracy Ln, Unit 413, Fairfax, VA</dd></div>
        <div><dt><Ticket aria-hidden="true" />Admission</dt><dd>{event.price_cents ? `${money(event.price_cents)} per ticket` : "Free with RSVP"}</dd></div>
        {left !== null && <div><dt><Users aria-hidden="true" />Seats</dt><dd>{left > 0 ? `${left} of ${event.capacity} left` : "Full"}</dd></div>}
      </dl>
    </section>
    <section className="detail-body">
      <article className="detail-description">
        <p className="eyebrow">About this event</p>
        {(event.description || "Details coming soon.").split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
      </article>
      <aside className="detail-panel" id="register">
        {checkout === "cancelled" && <p className="notice">Checkout was cancelled — your seat wasn’t reserved. You can try again below.</p>}
        {closedReason
          ? <div className="closed-note"><p className="eyebrow">Registration</p><h2>{closedReason}</h2><a className="text-link" href="/events">See other events</a></div>
          : <RegisterForm slug={event.slug} priceCents={event.price_cents} maxPerOrder={Math.min(event.max_per_order, left ?? event.max_per_order)} prefill={prefill} />}
      </aside>
    </section>
    <SiteFooter />
  </main>;
}
