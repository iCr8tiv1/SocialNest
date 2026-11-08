"use client";

import { usePathname } from "next/navigation";

const links = [
  ["Overview", "/admin"], ["Events", "/admin/events"], ["Office space", "/admin/spaces"],
  ["Bookings", "/admin/bookings"], ["Members", "/admin/members"], ["Venue requests", "/admin/inquiries"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return <nav className="admin-nav" aria-label="Admin">{links.map(([label, href]) => {
    const active = href === "/admin" ? path === href : path.startsWith(href);
    return <a key={href} href={href} aria-current={active ? "page" : undefined}>{label}</a>;
  })}</nav>;
}
