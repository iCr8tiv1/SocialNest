import type { Metadata } from "next";
import { ArrowRight, Building2, Clock3, KeyRound, Users } from "lucide-react";
import { PageHero, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { listActiveSpaces } from "@/lib/data";
import { money, spaceKindLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Office Space | Social Nest",
  description: "Private offices, desks and meeting rooms for small businesses at Social Nest in Fairfax, Virginia — by the hour, day or month.",
};

export default async function OfficesPage() {
  const spaces = await listActiveSpaces();
  return <main>
    <SiteHeader />
    <PageHero eyebrow="Office space" title="A professional home base for growing businesses." intro="Rent a private office, a desk, or a meeting room inside Social Nest — by the hour, day, or month — and work alongside the business owners in our network." />
    <section className="listing-section">
      {spaces.length ? <div className="listing-grid">{spaces.map((space) => <a className="listing-card" key={space.id} href={`/offices/${space.slug}`}>
        <p className="eyebrow">{spaceKindLabel[space.kind] || "Space"}</p>
        <h2>{space.name}</h2>
        {space.summary && <p>{space.summary}</p>}
        <ul className="rate-list">
          {space.hourly_rate_cents != null && <li><span>Hourly</span><b>{money(space.hourly_rate_cents)}</b></li>}
          {space.daily_rate_cents != null && <li><span>Daily</span><b>{money(space.daily_rate_cents)}</b></li>}
          {space.monthly_rate_cents != null && <li><span>Monthly</span><b>{money(space.monthly_rate_cents)}</b></li>}
        </ul>
        <span className="listing-meta"><Users size={16} aria-hidden="true" /> Up to {space.capacity}</span>
        <span className="listing-cta">Check availability <ArrowRight size={16} /></span>
      </a>)}</div>
        : <div className="empty-panel"><Building2 aria-hidden="true" /><h2>Office listings are coming soon.</h2><p>Email <a className="text-link" href="mailto:info@social-nest.com?subject=Office%20space">info@social-nest.com</a> to ask about private offices and desks.</p></div>}
    </section>
    <section className="planning-section">
      <div className="section-heading-left"><p className="eyebrow">How renting works</p><h2>Simple terms, real support.</h2></div>
      <div className="planning-grid">
        <article><Clock3 aria-hidden="true" /><span>01</span><h3>Hourly & daily</h3><p>Book a meeting room or office for a few hours or a few days and pay securely online.</p></article>
        <article><KeyRound aria-hidden="true" /><span>02</span><h3>Monthly terms</h3><p>Request a monthly office or desk. We’ll confirm availability, share the agreement, and set up billing.</p></article>
        <article><Users aria-hidden="true" /><span>03</span><h3>Built-in network</h3><p>Tenants get first access to our monthly business mixers and a listing in the member directory.</p></article>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
