import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Globe, Handshake, Link2, MapPin, Search, UsersRound } from "lucide-react";
import { PageHero, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getSessionUser } from "@/lib/auth";
import { directoryIndustries, listDirectory, listPublicEvents } from "@/lib/data";
import { longDate, money, timeOfDay } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Business Network | Social Nest",
  description: "Monthly business mixers and a member directory for small and mid-size business owners in Fairfax, Virginia.",
};

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ q?: string; industry?: string }> }) {
  const { q = "", industry = "" } = await searchParams;
  const [events, members, industries, user] = await Promise.all([
    listPublicEvents(), listDirectory({ q, industry }), directoryIndustries(), getSessionUser(),
  ]);
  const mixers = events.filter((e) => e.status === "published" && new Date(e.starts_at).getTime() > nowMs()).slice(0, 3);

  return <main>
    <SiteHeader />
    <PageHero eyebrow="The Social Nest network" title="Grow your business by growing your circle." intro="Open monthly mixers for small and mid-size business owners, a directory of local members, and a simple way to send each other referrals." />
    <section className="network-pillars">
      <article><CalendarDays aria-hidden="true" /><h3>Monthly mixers</h3><p>Open to everyone. Short introductions, real conversations, and a room full of local owners.</p></article>
      <article><UsersRound aria-hidden="true" /><h3>Member directory</h3><p>Create a free profile so attendees can find you, your services, and who you want to meet.</p></article>
      <article><Handshake aria-hidden="true" /><h3>Referrals</h3><p>Pass business to other members and track what comes back — all from your account.</p></article>
    </section>

    <section className="network-events">
      <div className="section-heading-left"><p className="eyebrow">Next gatherings</p><h2>Come meet the network.</h2></div>
      {mixers.length ? <div className="mini-event-list">{mixers.map((e) => <a key={e.id} href={`/events/${e.slug}`}>
        <div className="event-date-block"><b>{new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", day: "2-digit" }).format(new Date(e.starts_at))}</b><span>{new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short" }).format(new Date(e.starts_at))}</span></div>
        <div><p className="eyebrow">{e.category}</p><h3>{e.title}</h3><p>{longDate(e.starts_at)} · {timeOfDay(e.starts_at)} · {e.price_cents ? money(e.price_cents) : "Free RSVP"}</p></div>
        <ArrowRight aria-hidden="true" />
      </a>)}</div> : <p className="muted">The next mixer date is being set — <a className="text-link" href="/events">check the calendar</a> soon.</p>}
    </section>

    <section className="directory-section" id="directory">
      <div className="directory-head">
        <div><p className="eyebrow">Member directory</p><h2>{members.length} {members.length === 1 ? "business" : "businesses"}{industry ? ` in ${industry}` : ""}</h2></div>
        <form className="directory-filter" action="/network#directory">
          <label className="field-label"><span className="sr-only">Search</span><input name="q" placeholder="Search names, services…" defaultValue={q} /></label>
          <label className="field-label"><span className="sr-only">Industry</span><select name="industry" defaultValue={industry}><option value="">All industries</option>{industries.map((i) => <option key={i}>{i}</option>)}</select></label>
          <button className="button button-small" type="submit"><Search size={16} /> Filter</button>
        </form>
      </div>
      {members.length ? <div className="member-grid">{members.map((m) => <article className="member-card" key={m.id}>
        <div className="member-avatar" aria-hidden="true">{(m.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
        <h3>{m.full_name}</h3>
        <p className="member-business">{[m.title, m.business_name].filter(Boolean).join(" · ")}</p>
        {m.industry && <span className="pill">{m.industry}</span>}
        {m.bio && <p className="member-bio">{m.bio}</p>}
        <div className="member-links">
          {m.city && <span><MapPin size={14} aria-hidden="true" />{m.city}</span>}
          {m.website && <a href={m.website} target="_blank" rel="noreferrer nofollow"><Globe size={14} aria-hidden="true" />Website</a>}
          {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer nofollow"><Link2 size={14} aria-hidden="true" />LinkedIn</a>}
        </div>
      </article>)}</div> : <div className="empty-panel"><UsersRound aria-hidden="true" /><h2>{q || industry ? "No members match that search." : "Be the first business in the directory."}</h2></div>}
    </section>

    <section className="page-cta"><div><p className="eyebrow">Free to join</p><h2>Put your business in the room.</h2><p>Create a member profile to join the directory, send referrals, and keep your event tickets in one place.</p></div>
      <a className="button" href={user ? "/account" : "/login?next=/account"}>{user ? "Edit your profile" : "Join the network"} <ArrowRight size={18} /></a></section>
    <SiteFooter />
  </main>;
}
