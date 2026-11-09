import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Check, ExternalLink, Globe, Handshake, Link2, MapPin, Search, Sparkles, UsersRound, X } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getSessionUser } from "@/lib/auth";
import { directoryFacets, listDirectory, listPublicEvents } from "@/lib/data";
import { longDate, money, timeOfDay } from "@/lib/format";
import { nowMs } from "@/lib/time";
import type { ProfileRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Fairfax Business Directory | Social Nest",
  description: "Discover local founders, professionals, and small businesses in the Social Nest member directory for Fairfax, Virginia.",
};

function initials(member: ProfileRow) {
  return (member.business_name || member.full_name || "Social Nest")
    .split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ q?: string; industry?: string; city?: string; sort?: string }> }) {
  const { q = "", industry = "", city = "", sort: requestedSort = "business" } = await searchParams;
  const sort = (["business", "name", "newest"].includes(requestedSort) ? requestedSort : "business") as "business" | "name" | "newest";
  const [events, members, facets, user] = await Promise.all([
    listPublicEvents(), listDirectory({ q, industry, city, sort }), directoryFacets(), getSessionUser(),
  ]);
  const mixers = events.filter((e) => e.status === "published" && new Date(e.starts_at).getTime() > nowMs()).slice(0, 3);
  const filtered = Boolean(q || industry || city);
  const joinHref = user ? "/account#profile" : "/login?next=/account";
  const jsonLd = members.length ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Social Nest member directory",
    numberOfItems: members.length,
    itemListElement: members.map((member, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Organization",
        name: member.business_name || member.full_name,
        description: member.bio || undefined,
        url: member.website || undefined,
        address: member.city ? { "@type": "PostalAddress", addressLocality: member.city, addressRegion: "VA" } : undefined,
      },
    })),
  } : null;

  return <main>
    <SiteHeader />
    {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
    <section className="directory-hero">
      <div className="directory-hero-copy">
        <p className="eyebrow">The Social Nest directory</p>
        <h1>Find the people who make <em>business happen.</em></h1>
        <p>Discover Fairfax-area founders, professionals, and trusted small businesses. Search by what you need, meet them at the next mixer, or join the directory so they can find you.</p>
        <div className="directory-hero-actions">
          <a className="button" href="#directory">Explore the directory <ArrowRight size={17} /></a>
          <a className="text-link" href={joinHref}>{user ? "Manage your listing" : "Add your business"}</a>
        </div>
      </div>
      <aside className="directory-promise" aria-label="Directory benefits">
        <p><span><Search aria-hidden="true" /></span><b>Search local expertise</b><small>Find services, specialties, and businesses nearby.</small></p>
        <p><span><Handshake aria-hidden="true" /></span><b>Make warm connections</b><small>Members can send and track trusted referrals.</small></p>
        <p><span><Check aria-hidden="true" /></span><b>Privacy by design</b><small>Email addresses and phone numbers are never public.</small></p>
      </aside>
    </section>

    <section className="directory-stats" aria-label="Network highlights">
      <p><b>{members.length}</b><span>Listed {members.length === 1 ? "business" : "businesses"}</span></p>
      <p><b>{facets.industries.length}</b><span>{facets.industries.length === 1 ? "Industry" : "Industries"}</span></p>
      <p><b>{facets.cities.length}</b><span>{facets.cities.length === 1 ? "Local community" : "Local communities"}</span></p>
      <p><b>Free</b><span>To create a listing</span></p>
    </section>

    <section className="directory-section" id="directory">
      <div className="directory-head">
        <div><p className="eyebrow">Member directory</p><h2>Meet your next connection.</h2><p>Every listing is created and controlled by a Social Nest member.</p></div>
      </div>
      <form className="directory-filter" action="/network#directory">
        <label className="directory-search"><span className="sr-only">Search members</span><Search size={19} aria-hidden="true" /><input name="q" placeholder="Search a name, business, service, or specialty" defaultValue={q} /></label>
        <label className="field-label"><span>Industry</span><select name="industry" defaultValue={industry}><option value="">All industries</option>{facets.industries.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field-label"><span>Location</span><select name="city" defaultValue={city}><option value="">All locations</option>{facets.cities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field-label"><span>Sort by</span><select name="sort" defaultValue={sort}><option value="business">Business name</option><option value="name">Member name</option><option value="newest">Newest members</option></select></label>
        <button className="button button-small" type="submit">Search directory</button>
      </form>
      <div className="directory-results-head">
        <p><b>{members.length}</b> {members.length === 1 ? "member" : "members"} found{industry ? ` in ${industry}` : ""}{city ? ` near ${city}` : ""}</p>
        {filtered && <a className="clear-filters" href="/network#directory"><X size={15} aria-hidden="true" /> Clear filters</a>}
      </div>
      {members.length ? <div className="member-grid">{members.map((m) => <article className="member-card" key={m.id}>
        <div className="member-card-top">
          <div className="member-avatar" aria-hidden="true">{initials(m)}</div>
          <span className="member-status"><i aria-hidden="true" /> Open to referrals</span>
        </div>
        <div className="member-card-copy">
          <p className="eyebrow">{m.industry || "Social Nest member"}</p>
          <h3>{m.business_name || m.full_name}</h3>
          <p className="member-business">{m.business_name ? [m.full_name, m.title].filter(Boolean).join(" · ") : m.title}</p>
          {m.bio && <p className="member-bio">{m.bio}</p>}
        </div>
        <div className="member-links">
          {m.city && <span><MapPin size={14} aria-hidden="true" />{m.city}</span>}
          {m.website && <a href={m.website} target="_blank" rel="noreferrer nofollow"><Globe size={14} aria-hidden="true" />Website <ExternalLink size={12} /></a>}
          {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer nofollow"><Link2 size={14} aria-hidden="true" />LinkedIn <ExternalLink size={12} /></a>}
        </div>
      </article>)}</div> : <div className="empty-panel"><UsersRound aria-hidden="true" /><p className="eyebrow">{filtered ? "Try another search" : "The directory starts with you"}</p><h2>{filtered ? "No members match those filters." : "Be the first business in the directory."}</h2><p>{filtered ? "Broaden your search or clear the filters to see every member." : "Create a free profile and help shape Fairfax’s newest business community."}</p><a className="button button-small" href={filtered ? "/network#directory" : joinHref}>{filtered ? "Show all members" : "Create your listing"}</a></div>}
    </section>

    {!members.length && <section className="directory-launch">
      <div><Sparkles aria-hidden="true" /><p className="eyebrow">Founding listings</p><h2>Your business belongs here.</h2><p>The directory is opening with the next Social Nest mixer. Create your profile now and be among the first businesses local members discover.</p></div>
      <a className="button" href={joinHref}>{user ? "Publish your listing" : "Create your free listing"} <ArrowRight size={18} /></a>
    </section>}

    <section className="directory-guide">
      <div className="section-heading-left"><p className="eyebrow">More than a list</p><h2>A directory designed to start conversations.</h2><p>Find the right person online, meet face-to-face at Social Nest, and keep the relationship moving through member referrals.</p></div>
      <div className="directory-guide-grid">
        <article><span>01</span><Search aria-hidden="true" /><h3>Discover</h3><p>Search by expertise, business, industry, or location.</p></article>
        <article><span>02</span><CalendarDays aria-hidden="true" /><h3>Meet</h3><p>Turn a promising listing into a real connection at a monthly mixer.</p></article>
        <article><span>03</span><Handshake aria-hidden="true" /><h3>Refer</h3><p>Signed-in members can send warm referrals and track the outcome privately.</p></article>
      </div>
    </section>

    <section className="network-events">
      <div className="section-heading-left"><p className="eyebrow">Next gatherings</p><h2>Meet the network in person.</h2><p>Good directories help you search. Great communities give you somewhere to connect.</p></div>
      {mixers.length ? <div className="mini-event-list">{mixers.map((e) => <a key={e.id} href={`/events/${e.slug}`}>
        <div className="event-date-block"><b>{new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", day: "2-digit" }).format(new Date(e.starts_at))}</b><span>{new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short" }).format(new Date(e.starts_at))}</span></div>
        <div><p className="eyebrow">{e.category}</p><h3>{e.title}</h3><p>{longDate(e.starts_at)} · {timeOfDay(e.starts_at)} · {e.price_cents ? money(e.price_cents) : "Free RSVP"}</p></div>
        <ArrowRight aria-hidden="true" />
      </a>)}</div> : <p className="muted">The next mixer date is being set — <a className="text-link" href="/events">check the calendar</a> soon.</p>}
    </section>

    <section className="page-cta"><div><p className="eyebrow">Free to join</p><h2>Put your business in the room.</h2><p>Create a member profile to join the directory, send referrals, and keep your event registrations in one place.</p></div>
      <a className="button" href={joinHref}>{user ? "Edit your listing" : "Join the network"} <ArrowRight size={18} /></a></section>
    <SiteFooter />
  </main>;
}
