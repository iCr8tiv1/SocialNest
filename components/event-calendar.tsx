"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Ticket } from "lucide-react";

export type CalendarEvent = {
  slug: string;
  title: string;
  date: string;
  time: string;
  category: string;
  priceLabel: string;
  actionLabel: string;
  cancelled: boolean;
};
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function EventCalendar({ events: publicEvents }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [month, setMonth] = useState(() => {
    const next = publicEvents.find((event) => event.date >= monthKey(today) && !event.cancelled);
    return next ? new Date(Number(next.date.slice(0, 4)), Number(next.date.slice(5, 7)) - 1, 1) : new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const monthEvents = publicEvents.filter((event) => event.date.startsWith(monthKey(month)));
  const days = useMemo(() => {
    const leading = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);
  const moveMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const label = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return <section className="public-calendar" aria-labelledby="calendar-title">
    <div className="calendar-heading">
      <div><p className="eyebrow">Upcoming at Social Nest</p><h2 id="calendar-title">Public event calendar</h2></div>
      <p>Choose a month to browse upcoming experiences. Event listings will show whether admission is free or ticketed.</p>
    </div>
    <div className="calendar-layout">
      <div className="calendar-panel">
        <div className="calendar-toolbar"><button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft /></button><h3 aria-live="polite">{label}</h3><button type="button" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight /></button></div>
        <div className="calendar-weekdays" aria-hidden="true">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">{days.map((day, index) => {
          if (!day) return <span className="calendar-blank" key={`blank-${index}`} />;
          const dateKey = `${monthKey(month)}-${String(day).padStart(2, "0")}`;
          const hasEvent = publicEvents.some((event) => event.date === dateKey);
          const isToday = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && today.getDate() === day;
          return <span className={`${hasEvent ? "has-event" : ""} ${isToday ? "is-today" : ""}`} key={dateKey}>{day}{hasEvent && <i aria-label="Event scheduled" />}</span>;
        })}</div>
        <div className="calendar-legend"><span><i /> Event date</span><span>Times shown in Eastern Time</span></div>
      </div>
      <div className="event-results" aria-live="polite">
        {monthEvents.length ? monthEvents.map((event) => <article key={event.slug}><div className="event-date-block"><b>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { day: "2-digit" })}</b><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</span></div><div><p className="eyebrow">{event.category}</p><h3>{event.title}</h3><p>{event.time} · {event.priceLabel}</p></div>{event.cancelled ? <span className="event-status-pill">Cancelled</span> : <a className="button button-small" href={`/events/${event.slug}`}>{event.actionLabel} <Ticket size={16} /></a>}</article>) : <div className="event-empty"><CalendarDays aria-hidden="true" /><p className="eyebrow">No events posted for {label}</p><h3>New dates are coming soon.</h3><p>Confirmed public events will appear here with the date, time, price, and a direct link to register or purchase tickets.</p><a className="text-link" href="mailto:info@social-nest.com?subject=Social%20Nest%20public%20event%20updates">Ask about upcoming events</a></div>}
      </div>
    </div>
  </section>;
}
