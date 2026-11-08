"use client";

import { useActionState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { sendSignInLink } from "@/app/login/actions";
import type { FormState } from "@/lib/forms";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendSignInLink, null);
  if (state?.ok) return <div className="form-success"><span><MailCheck /></span><p className="eyebrow">Check your inbox</p><h2>We sent a sign-in link to {state.message}.</h2><p>Open it on this device to finish signing in. It expires in an hour.</p></div>;
  return <form className="panel-form" action={action}>
    <input type="hidden" name="next" value={next} />
    <label className="field-label">Email<input name="email" type="email" autoComplete="email" required autoFocus /></label>
    {state?.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="button submit-button" type="submit" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"} <ArrowRight size={17} /></button>
    <small className="fine-print">New here? The same link creates your free member account.</small>
  </form>;
}
