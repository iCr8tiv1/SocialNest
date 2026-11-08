"use client";

import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function NestMark() {
  return <span className="nest-mark" aria-hidden="true"><i /><i /><i /><b /></span>;
}

const nav = [
  ["The space", "/space"],
  ["Events", "/events"],
  ["Network", "/network"],
  ["Offices", "/offices"],
  ["Amenities", "/amenities"],
  ["Gallery", "/gallery"],
  ["Tour", "/tour"],
  ["FAQ", "/faq"],
  ["Account", "/account"],
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  return <>
    <div className="announcement">Now booking private events, meetings & gatherings</div>
    <header className="site-header">
      <a className="brand" href="/" aria-label="Social Nest home"><NestMark /><span>SOCIAL NEST<small>Your place to gather</small></span></a>
      <nav className="desktop-nav" aria-label="Primary navigation">{nav.map(([label, href]) => <a key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</a>)}</nav>
      <a className="button button-small" href="/book">Book the Nest <ArrowRight size={16} /></a>
      <button className="mobile-menu-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(([label, href]) => <a key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}<ArrowRight size={18}/></a>)}<a className="mobile-book-link" href="/book" aria-current={pathname === "/book" ? "page" : undefined}>Book the Nest <ArrowRight size={18}/></a></nav>}
  </>;
}

export function SiteFooter() {
  return <footer>
    <a className="brand footer-brand" href="/"><NestMark /><span>SOCIAL NEST<small>Your place to gather</small></span></a>
    <p>Meet. Learn. Connect. Celebrate. Create.<br/><a className="footer-address" href="https://www.google.com/maps/search/?api=1&query=10301%20Democracy%20Ln%20Unit%20413%2C%20Fairfax%2C%20VA%2022030" target="_blank" rel="noreferrer">10301 Democracy Ln, Unit 413<br/>Fairfax, VA 22030</a><br/><a className="footer-email" href="mailto:info@social-nest.com">info@social-nest.com</a></p>
    <nav aria-label="Footer navigation"><a href="/space">The space</a><a href="/network">Network</a><a href="/offices">Office space</a><a href="/account">Member sign in</a><a href="/tour">Schedule a tour</a><a href="/policies">Rental policies</a><a href="/privacy">Privacy</a><a href="/faq">FAQ</a><a href="/book">Book</a></nav>
    <small>© 2026 Social Nest</small>
  </footer>;
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return <section className="page-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></section>;
}

export function PageCta({ title, text = "Tell us what you’re planning and we’ll help you choose the right setup and package." }: { title: string; text?: string }) {
  return <section className="page-cta"><div><p className="eyebrow">Plan your gathering</p><h2>{title}</h2><p>{text}</p></div><a className="button" href="/book">Book the Nest <ArrowRight size={18} /></a></section>;
}
