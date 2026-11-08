"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, CheckCircle2, Clock3, Coffee, FileCheck2, MapPin, Monitor, Sparkles, Users, Wifi } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

const purposes = [
  { key: "Meet", copy: "A comfortable, professional setting for focused conversations and decisions.", examples: ["Client meetings", "Team planning", "Interviews", "Board meetings", "Off-site sessions"], picks: ["Quick Meet", "Business Session", "Half Day"] },
  { key: "Learn", copy: "A flexible room for sharing knowledge, practicing skills, and developing ideas.", examples: ["Workshops", "Training sessions", "Seminars", "Coaching", "Small classes"], picks: ["Workshop", "Half Day", "Full Day"] },
  { key: "Connect", copy: "An inviting space designed to help people meet, mingle, and build relationships.", examples: ["Networking mixers", "Community groups", "Meet-and-greets", "Club gatherings", "Professional socials"], picks: ["Social Gathering", "Half Day", "Full Day"] },
  { key: "Celebrate", copy: "A warm backdrop for personal milestones and the people who make them meaningful.", examples: ["Baby showers", "Birthdays", "Graduations", "Anniversaries", "Engagement parties"], picks: ["Celebration", "Half Day", "Full Day"] },
  { key: "Create", copy: "A polished, adaptable setting for producing photos, video, and original content.", examples: ["Brand photography", "Headshots", "Video interviews", "Product shoots", "Content days"], picks: ["Quick Meet", "Half Day", "Full Day"] },
];
const packages = [
  { name: "Quick Meet", hours: "2 hours", price: "$150", for: "Interviews, consultations & small meetings" },
  { name: "Business Session", hours: "3 hours", price: "$225", for: "Team meetings, presentations & planning" },
  { name: "Workshop", hours: "4 hours", price: "$350", for: "Classes, training & seminars" },
  { name: "Social Gathering", hours: "4 hours", price: "$395", for: "Networking, mixers & community events" },
  { name: "Celebration", hours: "4 hours", price: "$495", for: "Showers, birthdays & private celebrations" },
  { name: "Half Day", hours: "6 hours", price: "$595", for: "Extended events, workshops & productions" },
  { name: "Full Day", hours: "10 hours", price: "$895", for: "Retreats, productions & all-day events" },
];
export default function Home() {
  const [active, setActive] = useState("Meet");
  const selected = purposes.find((item) => item.key === active)!;
  const visible = packages.filter((item) => selected.picks.includes(item.name));
  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: "select_gathering_purpose",
      title: "Select gathering purpose",
      description: "Select a Social Nest gathering purpose and show its recommended packages in the visible page.",
      inputSchema: { type: "object", properties: { purpose: { type: "string", enum: purposes.map((item) => item.key) } }, required: ["purpose"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const purpose = (input as { purpose?: string })?.purpose;
        if (!purposes.some((item) => item.key === purpose)) throw new Error("Choose Meet, Learn, Connect, Celebrate, or Create.");
        setActive(purpose!);
        document.querySelector("#packages")?.scrollIntoView({ behavior: "smooth" });
        return { purpose, packages: packages.filter((item) => purposes.find((p) => p.key === purpose)?.picks.includes(item.name)).map((item) => item.name) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  return <main>
    <SiteHeader />
    <section className="hero" id="top">
      <div className="hero-copy"><p className="eyebrow">Meet · Learn · Connect · Celebrate · Create</p><h1>Your place<br />to <em>gather.</em></h1><p className="lede">A warm, flexible private venue for the moments that bring people together—from focused meetings to joyful celebrations.</p><div className="hero-actions"><a className="button" href="#gather">Find your gathering <ArrowRight size={18} /></a><a className="text-link" href="/space">Explore the space</a></div></div>
      <div className="hero-visual"><Image src="/social-nest-configurations.jpg" alt="Social Nest arranged for a meeting, networking event, workshop, and celebration" fill priority sizes="(max-width: 800px) 100vw, 52vw" /><span className="image-note">One space. Endless possibilities.</span></div>
    </section>
    <section className="purpose-section" id="gather">
      <div className="section-intro"><p className="eyebrow">Start with your purpose</p><h2>What are you gathering for?</h2></div>
      <div className="purpose-tabs" role="tablist" aria-label="Gathering purpose">{purposes.map((item, index) => <button key={item.key} role="tab" aria-selected={active === item.key} onClick={() => setActive(item.key)}><span>0{index + 1}</span>{item.key}</button>)}</div>
      <div className="purpose-result" role="tabpanel"><div><p className="eyebrow">{active} at Social Nest</p><h3>{selected.copy}</h3><p className="purpose-guidance">Choose a straightforward package, then personalize your setup with time, hospitality, equipment, and event support.</p><div className="purpose-examples"><span>Examples</span><ul>{selected.examples.map(example=><li key={example}>{example}</li>)}</ul></div></div><a className="round-link" href="/book" aria-label={`Book a ${active.toLowerCase()} gathering`}><ArrowRight /></a></div>
    </section>
    <section className="space-section" id="space"><div className="space-statement"><p className="eyebrow">The space</p><h2>Polished enough to feel special.<br /><em>Flexible enough to feel yours.</em></h2></div><div className="space-grid"><p>Social Nest sits between a boutique venue, creative studio, and professional meeting room. The neutral, warm setting adapts to your people and your plans—not the other way around.</p><div className="detail-card"><span>Designed for</span><strong>Meaningful moments in many forms</strong><small>Business · Social · Creative · Community</small></div></div></section>
    <section className="package-section" id="packages">
      <div className="package-heading"><div><p className="eyebrow">Recommended for {active}</p><h2>Simple packages.<br />Room to make them yours.</h2></div><p>Working launch pricing. Additional setup time, event hours, hospitality, equipment, and staffing are available. A $50 cleaning fee applies to every booking.</p></div>
      <div className="package-grid">{visible.map((item, index) => <article className={index === 1 ? "package featured" : "package"} key={item.name}><div className="package-top"><span>{item.hours}</span>{index === 1 && <small>Popular fit</small>}</div><h3>{item.name}</h3><p>{item.for}</p><div className="price">{item.price}<small> / booking</small></div><p className="required-fee">+ $50 required cleaning fee</p><a href={`/book?package=${encodeURIComponent(item.name)}`}>Choose this package <ArrowRight size={17} /></a></article>)}</div>
      <p className="package-note">Need more time? Half Day is 6 hours from $595. Full Day is 10 hours from $895. Every booking includes an additional $50 cleaning fee.</p>
    </section>
    <section className="amenities" id="amenities"><div><p className="eyebrow">Made easy</p><h2>The essentials are already here.</h2><p>Arrive with your people and your purpose. We’ll help with the practical details that make the room work.</p></div><ul><li><Wifi />Reliable Wi-Fi</li><li><Users />Flexible tables & chairs</li><li><Monitor />Presentation display</li><li><Coffee />Refreshment options</li><li><Clock3 />Extended hours by request</li><li><Sparkles />Setup & cleaning support</li></ul></section>
    <section className="booking-path" aria-labelledby="booking-path-title"><div className="booking-path-heading"><p className="eyebrow">A clear path to your date</p><h2 id="booking-path-title">How booking works.</h2><p>Your inquiry starts the conversation. Nothing is charged or reserved until the details are reviewed with you.</p></div><div className="booking-path-steps"><article><span>01</span><CalendarCheck/><h3>Request your date</h3><p>Choose a package, preferred date, guest count, and any helpful enhancements.</p></article><article><span>02</span><FileCheck2/><h3>Review the plan</h3><p>We confirm availability, event fit, final pricing, policies, and any deposit or insurance needs.</p></article><article><span>03</span><CheckCircle2/><h3>Complete the reservation</h3><p>Your date is secured after the agreement is signed and the required reservation payment is received.</p></article></div><div className="booking-path-actions"><a className="button" href="/book">Build your estimate <ArrowRight size={18}/></a><a className="text-link" href="/tour">Schedule a tour</a></div></section>
    <section className="availability" id="contact"><div><p className="eyebrow">Plan your gathering</p><h2>Have something worth gathering for?</h2><p>Tell us what you’re planning and we’ll help match your event to the right time, setup, and package.</p><a className="location-link" href="https://www.google.com/maps/search/?api=1&query=10301%20Democracy%20Ln%20Unit%20413%2C%20Fairfax%2C%20VA%2022030" target="_blank" rel="noreferrer"><MapPin size={18}/><span>10301 Democracy Ln, Unit 413<br/>Fairfax, VA 22030</span></a><a className="contact-email" href="mailto:info@social-nest.com">info@social-nest.com</a></div><div className="hours-card"><h3>Typical availability</h3><p><span>Monday–Thursday</span><b>8 AM–9 PM</b></p><p><span>Friday</span><b>8 AM–10 PM</b></p><p><span>Saturday</span><b>9 AM–10 PM</b></p><p><span>Sunday</span><b>10 AM–7 PM</b></p><a className="button" href="/book">Start a booking inquiry <ArrowRight size={18} /></a></div></section>
    <SiteFooter />
  </main>;
}
