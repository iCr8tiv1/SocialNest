import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BookingForm } from "@/components/booking-form";
import { getSessionUser } from "@/lib/auth";
import { stripeConfigured } from "@/lib/config";
import { getActiveSpace, upcomingBlocks } from "@/lib/data";
import { dateTime, money, shortDate, spaceKindLabel } from "@/lib/format";
import { adminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const space = await getActiveSpace((await params).slug);
  return { title: space ? `${space.name} | Social Nest Office Space` : "Office Space | Social Nest", description: space?.summary || undefined };
}

export default async function SpacePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { checkout } = await searchParams;
  const space = await getActiveSpace(slug);
  if (!space) notFound();
  const blocks = await upcomingBlocks(space.id);
  const user = await getSessionUser();
  let prefill = {};
  if (user) {
    const { data } = await adminDb().from("profiles").select("full_name, email, business_name, phone").eq("id", user.id).maybeSingle();
    prefill = { name: data?.full_name || "", email: data?.email || user.email, business: data?.business_name || "", phone: data?.phone || "" };
  }

  return <main>
    <SiteHeader />
    <section className="detail-hero">
      <div><p className="eyebrow">{spaceKindLabel[space.kind] || "Space"}</p><h1>{space.name}</h1>{space.summary && <p className="detail-lede">{space.summary}</p>}</div>
      <dl className="detail-facts">
        <div><dt><Users aria-hidden="true" />Capacity</dt><dd>Up to {space.capacity}</dd></div>
        {space.hourly_rate_cents != null && <div><dt>Hourly</dt><dd>{money(space.hourly_rate_cents)} / hour</dd></div>}
        {space.daily_rate_cents != null && <div><dt>Daily</dt><dd>{money(space.daily_rate_cents)} / day</dd></div>}
        {space.monthly_rate_cents != null && <div><dt>Monthly</dt><dd>{money(space.monthly_rate_cents)} / month</dd></div>}
      </dl>
    </section>
    <section className="detail-body">
      <article className="detail-description">
        <p className="eyebrow">About this space</p>
        {(space.description || space.summary || "").split(/\n{2,}/).filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
        {space.amenities.length > 0 && <ul className="amenity-chips">{space.amenities.map((a) => <li key={a}><CheckCircle2 size={16} aria-hidden="true" />{a}</li>)}</ul>}
        <div className="booked-list">
          <p className="eyebrow">Already booked</p>
          {blocks.length ? <ul>{blocks.map((b, i) => <li key={i}>{b.booking_type === "hourly" ? `${dateTime(b.starts_at)} – ${dateTime(b.ends_at)}` : `${shortDate(b.starts_at)} – ${shortDate(new Date(new Date(b.ends_at).getTime() - 1000))}`}</li>)}</ul> : <p>No upcoming bookings — most times are open.</p>}
        </div>
      </article>
      <aside className="detail-panel" id="book">
        {checkout === "cancelled" && <p className="notice">Checkout was cancelled — nothing was charged and the time wasn’t held.</p>}
        <BookingForm slug={space.slug} rates={{ hourly: space.hourly_rate_cents, daily: space.daily_rate_cents, monthly: space.monthly_rate_cents }} payOnline={stripeConfigured} prefill={prefill} />
      </aside>
    </section>
    <SiteFooter />
  </main>;
}
