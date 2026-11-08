import type { Metadata } from "next";
import Image from "next/image";
import { Accessibility, Armchair, Building2, Camera, DoorOpen, ParkingCircle, Presentation, Refrigerator, Route, Ruler, Sparkles, Users } from "lucide-react";
import { PageCta, PageHero, SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "The Space | Social Nest", description: "Explore the warm, adaptable Social Nest venue and its many possible configurations." };
const formats = [
  { icon: Presentation, title: "Focused & professional", text: "A polished setting for meetings, workshops, interviews, strategy sessions, and presentations." },
  { icon: Users, title: "Open & social", text: "Flexible layouts for networking, mixers, community meetups, and partner events." },
  { icon: Armchair, title: "Warm & celebratory", text: "A neutral backdrop that welcomes flowers, balloons, signage, and your own personal details." },
  { icon: Camera, title: "Clean & creative", text: "An adaptable environment for headshots, interviews, product shoots, and social content." },
];
const specifications = [
  {icon:Ruler,title:"1,800 sq. ft.",text:"A 30' × 60' fourth-floor room with 9' ceilings."},
  {icon:Users,title:"Up to 49 guests",text:"A conservative planning cap, subject to the approved posted occupant load, event layout, exits, and City review."},
  {icon:Refrigerator,title:"Breakroom",text:"Refrigerator, sink, and counters for light event preparation and service."},
  {icon:Accessibility,title:"Accessible arrival",text:"Front ADA ramp, sliding-glass building entry, and elevator access to the fourth floor."},
  {icon:DoorOpen,title:"Public restroom",text:"A high-quality shared restroom is located outside the unit on the same floor."},
  {icon:ParkingCircle,title:"200+ free spaces",text:"Complimentary on-site parking for hosts, guests, and vendors."},
];

export default function SpacePage() { return <main><SiteHeader /><PageHero eyebrow="The space" title="One room. Many reasons to gather." intro="Social Nest is intentionally simple, warm, and adaptable—giving your event a polished foundation without getting in the way of your ideas." />
  <section className="split-feature"><div className="split-image arch-image"><Image src="/social-nest-configurations.jpg" alt="Four Social Nest room configurations" fill sizes="(max-width: 800px) 100vw, 50vw" /></div><div className="split-copy"><p className="eyebrow">Designed to change with you</p><h2>A setting that supports the moment.</h2><p>The same space can move from a focused morning workshop to an evening celebration. Furniture, décor, tables, flowers, signage, and temporary equipment can change while the room stays unmistakably Social Nest.</p><ul className="check-list"><li>Warm earth tones and natural textures</li><li>Flexible tables and seating</li><li>Clean presentation and content backdrops</li><li>Room to add your own décor and identity</li></ul></div></section>
  <section className="feature-grid-section"><div className="section-heading-left"><p className="eyebrow">A space that works</p><h2>Made for more than one kind of moment.</h2></div><div className="feature-grid">{formats.map(({icon:Icon,title,text})=><article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section className="spec-section"><div className="section-heading-left"><p className="eyebrow">Space specifications</p><h2>The details behind the room.</h2></div><div className="spec-grid">{specifications.map(({icon:Icon,title,text})=><article key={title}><Icon/><h3>{title}</h3><p>{text}</p></article>)}</div><p className="capacity-disclaimer"><Building2 size={18}/> Final occupancy may not exceed the building’s approved Certificate of Occupancy or posted occupant load. Social Nest confirms the permitted guest count and layout before each reservation.</p></section>
  <section className="planning-section"><div className="section-heading-left"><p className="eyebrow">Plan the room</p><h2>Every layout starts with how people should feel.</h2><p>Tell us what needs to happen during your gathering and we’ll shape the room around the flow—not just the headcount.</p></div><div className="planning-grid"><article><Presentation/><span>01</span><h3>Choose the focus</h3><p>Conversation, instruction, presentation, celebration, or content creation.</p></article><article><Route/><span>02</span><h3>Map the movement</h3><p>Arrival, seating, food service, activities, photos, and transitions.</p></article><article><Sparkles/><span>03</span><h3>Add your details</h3><p>Bring in the décor, signage, refreshments, and equipment that make it yours.</p></article></div></section>
  <section className="principle-band"><p>Our guiding principle</p><blockquote>Keep the room neutral enough to make it yours—and thoughtful enough to feel complete when you arrive.</blockquote></section><section className="page-cta"><div><p className="eyebrow">Visit the fourth floor</p><h2>See the space before you book.</h2><p>Choose a preferred tour time and add the request to Google Calendar. Tours are confirmed by Social Nest.</p></div><a className="button" href="/tour">Schedule a tour</a></section><SiteFooter /></main>; }
