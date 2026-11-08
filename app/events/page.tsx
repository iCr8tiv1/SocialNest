import type { Metadata } from "next";
import { BriefcaseBusiness, Camera, GraduationCap, PartyPopper, UsersRound } from "lucide-react";
import { EventCalendar } from "@/components/event-calendar";
import { PageCta, PageHero, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { listPublicEvents } from "@/lib/data";
import { etDateKey, money, timeOfDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public Events | Social Nest",
  description: "Explore upcoming public workshops, networking events, creative sessions, and community gatherings at Social Nest in Fairfax, Virginia.",
};

const eventTypes = [
  { icon: UsersRound, title: "Networking & community", text: "Professional mixers, local groups, partner events, and meet-and-greets." },
  { icon: GraduationCap, title: "Workshops & classes", text: "Practical sessions covering business, creativity, wellness, and useful skills." },
  { icon: Camera, title: "Headshot & content days", text: "Scheduled creative sessions for polished photos, video, and brand content." },
  { icon: PartyPopper, title: "Social experiences", text: "Ticketed gatherings designed for connection, celebration, and something new." },
  { icon: BriefcaseBusiness, title: "Partner programs", text: "Public events presented with local businesses, associations, and community organizations." },
];

export default async function EventsPage() {
  const events = (await listPublicEvents()).map((event) => ({
    slug: event.slug,
    title: event.title,
    date: etDateKey(event.starts_at),
    time: event.ends_at ? `${timeOfDay(event.starts_at)} – ${timeOfDay(event.ends_at)}` : timeOfDay(event.starts_at),
    category: event.category,
    priceLabel: event.price_cents ? `${money(event.price_cents)} ticket` : "Free RSVP",
    actionLabel: event.price_cents ? "Buy tickets" : "Register",
    cancelled: event.status === "cancelled",
  }));
  return <main>
    <SiteHeader />
    <PageHero eyebrow="Public events" title="There’s always a reason to gather." intro="Explore upcoming workshops, networking events, creative sessions, and community experiences at Social Nest. Register for free events or purchase tickets directly from each listing." />
    <EventCalendar events={events} />
    <section className="public-event-types" aria-labelledby="event-types-title">
      <div className="section-heading-left"><p className="eyebrow">What to expect</p><h2 id="event-types-title">Events made for connection.</h2><p>Our public calendar will feature a thoughtful mix of learning, professional connection, creativity, and community.</p></div>
      <div className="public-event-type-grid">{eventTypes.map(({ icon: Icon, title, text }) => <article key={title}><Icon aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <PageCta title="Want to host your own event?" text="Reserve Social Nest for a private meeting, workshop, celebration, production, or community gathering." />
    <SiteFooter />
  </main>;
}
