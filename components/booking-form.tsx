"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { requestBooking } from "@/app/offices/[slug]/actions";
import type { FormState } from "@/lib/forms";

type Rates = { hourly: number | null; daily: number | null; monthly: number | null };
type BookingType = keyof Rates;
const labels: Record<BookingType, string> = { hourly: "By the hour", daily: "By the day", monthly: "Monthly" };

export function BookingForm({ slug, rates, payOnline, prefill }: { slug: string; rates: Rates; payOnline: boolean; prefill: { name?: string; email?: string; business?: string; phone?: string } }) {
  const types = (Object.keys(rates) as BookingType[]).filter((t) => rates[t] != null);
  const [type, setType] = useState<BookingType>(types[0] || "daily");
  const [units, setUnits] = useState(1);
  const [state, action, pending] = useActionState<FormState, FormData>(requestBooking.bind(null, slug), null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const estimate = ((rates[type] || 0) * units) / 100;
  const paysNow = payOnline && type !== "monthly";

  if (!types.length) return <p>Contact info@social-nest.com for pricing.</p>;
  if (state?.ok) return <div className="form-success"><span><Check /></span><p className="eyebrow">Request received</p><h2>{state.message}</h2><a className="text-link" href="/offices">Back to office space</a></div>;

  const unitField = type === "hourly"
    ? <div className="field-grid"><label className="field-label">Start time<input name="time" type="time" min="07:00" max="21:00" step="1800" defaultValue="09:00" required /></label>
        <label className="field-label">Hours<select name="hours" value={units} onChange={(e) => setUnits(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}</select></label></div>
    : type === "daily"
      ? <label className="field-label">Days<select name="days" value={units} onChange={(e) => setUnits(Number(e.target.value))}>{Array.from({ length: 30 }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}</select></label>
      : <label className="field-label">Months<select name="months" value={units} onChange={(e) => setUnits(Number(e.target.value))}>{[1, 2, 3, 6, 12].map((n) => <option key={n}>{n}</option>)}</select></label>;

  return <form className="panel-form" action={action}>
    <p className="eyebrow">Book this space</p>
    <div className="segmented" role="radiogroup" aria-label="Booking term">
      {types.map((t) => <label key={t} className={type === t ? "selected" : ""}><input type="radio" name="type" value={t} checked={type === t} onChange={() => { setType(t); setUnits(1); }} />{labels[t]}</label>)}
    </div>
    <label className="field-label">{type === "hourly" ? "Date" : "Start date"}<input name="date" type="date" min={today} required /></label>
    {unitField}
    <label className="field-label">Full name<input name="name" autoComplete="name" required defaultValue={prefill.name} /></label>
    <label className="field-label">Email<input name="email" type="email" autoComplete="email" required defaultValue={prefill.email} /></label>
    <div className="field-grid"><label className="field-label">Phone<input name="phone" type="tel" autoComplete="tel" defaultValue={prefill.phone} /></label><label className="field-label">Business<input name="business" autoComplete="organization" defaultValue={prefill.business} /></label></div>
    <label className="field-label">Notes<textarea name="notes" rows={2} placeholder="Team size, setup needs, questions" /></label>
    <p className="total-line"><span>{type === "monthly" ? "Estimated monthly total" : "Total"}</span><b>${estimate.toLocaleString("en-US", { maximumFractionDigits: 2 })}</b></p>
    {state?.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="button submit-button" type="submit" disabled={pending}>{pending ? "Working…" : paysNow ? "Continue to secure checkout" : "Request this space"} <ArrowRight size={17} /></button>
    <small className="fine-print">{paysNow ? "Payments are processed by Stripe. The time is held for 30 minutes during checkout." : type === "monthly" ? "Monthly terms are confirmed with a short agreement before billing starts." : "We’ll confirm availability and send payment details by email."}</small>
  </form>;
}
