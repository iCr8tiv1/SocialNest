"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Ticket } from "lucide-react";

type PublicEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  priceLabel: string;
  actionLabel: "Register" | "Buy tickets";
};

// Confirmed public events belong here. The launch calendar stays empty so
// unconfirmed dates, prices, or ticket links are never presented as real.
const publicEvents: PublicEvent[] = [
  {
    id: "azzys-insurance-open-house-2026-10-07",
    title: "Azzy’s Insurance Office Open House",
    date: "2026-10-07",
    time: "Time to be announced",
    category: "Open house",
    priceLabel: "Free RSVP",
    actionLabel: "Register",
  },
];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function EventCalendar() {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const monthEvents = publicEvents.filter((event) => event.date.startsWith(monthKey(month)));
  const days = useMemo(() => {
    const leading = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);
  const moveMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const label = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const openRegistration = (event: PublicEvent) => {
    setSelectedEvent(event);
    setSubmitted(false);
    setSubmitError("");
    requestAnimationFrame(() => document.querySelector("#event-registration")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const submitRegistration = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!selectedEvent) return;
    setSubmitting(true);
    setSubmitError("");
    const data = new FormData(formEvent.currentTarget);
    data.set("Event", selectedEvent.title);
    data.set("Event date", new Date(`${selectedEvent.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    data.set("Event time", selectedEvent.time);
    data.set("_replyto", String(data.get("email") || ""));
    data.set("_subject", `New ticket registration — ${selectedEvent.title}`);
    data.set("_template", "table");
    data.set("_captcha", "false");
    data.set("_url", "https://social-nest.com/events");
    try {
      const response = await fetch("https://formsubmit.co/ajax/info@social-nest.com", { method: "POST", headers: { Accept: "application/json" }, body: data });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success === false) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setSubmitError("We couldn’t send your registration. Please try again or email info@social-nest.com.");
    } finally {
      setSubmitting(false);
    }
  };

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
        {monthEvents.length ? monthEvents.map((event) => <article key={event.id}><div className="event-date-block"><b>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { day: "2-digit" })}</b><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</span></div><div><p className="eyebrow">{event.category}</p><h3>{event.title}</h3><p>{event.time} · {event.priceLabel}</p></div><button className="button button-small" type="button" onClick={() => openRegistration(event)}>{event.actionLabel} <Ticket size={16} /></button></article>) : <div className="event-empty"><CalendarDays aria-hidden="true" /><p className="eyebrow">No events posted for {label}</p><h3>New dates are coming soon.</h3><p>Confirmed public events will appear here with the date, time, price, and a direct link to register or purchase tickets.</p><a className="text-link" href="mailto:info@social-nest.com?subject=Social%20Nest%20public%20event%20updates">Ask about upcoming events</a></div>}
      </div>
    </div>
    {selectedEvent && <div className="event-registration" id="event-registration">
      {submitted ? <div className="event-registration-success"><span><Check /></span><p className="eyebrow">Registration received</p><h3>You’re on the guest list.</h3><p>Your registration for {selectedEvent.title} has been submitted. Event updates will be sent using the contact information you provided.</p><button className="text-link" type="button" onClick={() => { setSelectedEvent(null); setSubmitted(false); }}>Close</button></div> :
      <><div className="event-registration-heading"><div><p className="eyebrow">Event registration</p><h3>{selectedEvent.title}</h3><p>{new Date(`${selectedEvent.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {selectedEvent.time}</p></div><button type="button" onClick={() => setSelectedEvent(null)} aria-label="Close registration form">Close</button></div>
      <form className="event-registration-form" onSubmit={submitRegistration}>
        <div className="field-grid"><label className="field-label">First name<input name="firstName" type="text" autoComplete="given-name" required /></label><label className="field-label">Last name<input name="lastName" type="text" autoComplete="family-name" required /></label><label className="field-label">Tickets<input name="ticketQuantity" type="number" min="1" max="10" defaultValue="1" required /></label></div>
        <div className="field-grid"><label className="field-label">Email<input name="email" type="email" autoComplete="email" required /></label><label className="field-label">Phone<input name="phone" type="tel" autoComplete="tel" required /></label></div>
        <label className="field-label">Organization or company<input name="organization" type="text" autoComplete="organization" placeholder="Optional" /></label>
        <label className="field-label">Accessibility needs or note<textarea name="notes" rows={3} placeholder="Optional" /></label>
        <label className="terms-check"><input type="checkbox" required /><span className="terms-copy">I agree to receive information about this event and understand that submitting this form registers my requested ticket quantity.</span></label>
        <p className="email-submit-note">Registration details will be sent securely to <strong>info@social-nest.com</strong>.</p>
        {submitError && <p className="email-submit-note" role="alert">{submitError}</p>}
        <button className="button submit-button" type="submit" disabled={submitting}>{submitting ? "Submitting registration…" : "Complete registration"} <Ticket size={17} /></button>
      </form></>}
    </div>}
  </section>;
}
