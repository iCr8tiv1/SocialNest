"use client";

import { useActionState, useState } from "react";
import { Check, Ticket } from "lucide-react";
import { registerForEvent } from "@/app/events/[slug]/actions";
import type { FormState } from "@/lib/forms";

type Prefill = { name?: string; email?: string; business?: string; industry?: string; phone?: string };

export function RegisterForm({ slug, priceCents, maxPerOrder, prefill }: { slug: string; priceCents: number; maxPerOrder: number; prefill: Prefill }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerForEvent.bind(null, slug), null);
  const [qty, setQty] = useState(1);
  const total = (priceCents * qty) / 100;

  if (state?.ok) {
    return <div className="form-success">
      <span><Check /></span>
      <p className="eyebrow">You’re registered</p>
      <h2>{state.message}</h2>
      {state.code && <p>Your check-in code is <strong className="checkin-code">{state.code}</strong>. Show it at the door — it’s also saved in your account if you’re signed in.</p>}
      <a className="text-link" href="/network">Meet the network</a>
    </div>;
  }

  return <form className="panel-form" action={action}>
    <p className="eyebrow">{priceCents ? "Get tickets" : "Reserve your spot"}</p>
    <label className="field-label">Full name<input name="name" autoComplete="name" required defaultValue={prefill.name} /></label>
    <label className="field-label">Email<input name="email" type="email" autoComplete="email" required defaultValue={prefill.email} /></label>
    <label className="field-label">Phone<input name="phone" type="tel" autoComplete="tel" placeholder="Optional" defaultValue={prefill.phone} /></label>
    <label className="field-label">Business<input name="business" autoComplete="organization" placeholder="Optional" defaultValue={prefill.business} /></label>
    <label className="field-label">Industry<input name="industry" placeholder="e.g. Insurance, Real estate" defaultValue={prefill.industry} /></label>
    <label className="field-label">{priceCents ? "Tickets" : "Guests (including you)"}
      <select name="quantity" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
        {Array.from({ length: Math.max(maxPerOrder, 1) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
    <label className="field-label">Note<textarea name="notes" rows={2} placeholder="Accessibility needs or anything we should know" /></label>
    {priceCents > 0 && <p className="total-line"><span>Total</span><b>${total.toFixed(total % 1 ? 2 : 0)}</b></p>}
    {state?.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="button submit-button" type="submit" disabled={pending}>
      {pending ? "Working…" : priceCents ? "Continue to secure checkout" : "Complete RSVP"} <Ticket size={17} />
    </button>
    {priceCents > 0 && <small className="fine-print">Payments are processed by Stripe. Your seat is held for 30 minutes during checkout.</small>}
  </form>;
}
