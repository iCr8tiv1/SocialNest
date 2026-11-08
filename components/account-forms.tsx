"use client";

import { useActionState } from "react";
import { saveProfile, sendReferral } from "@/app/account/actions";
import type { FormState } from "@/lib/forms";
import type { ProfileRow } from "@/lib/types";

export function ProfileForm({ profile }: { profile: ProfileRow | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, null);
  const p = profile;
  return <form className="panel-form profile-form" action={action}>
    <div className="field-grid">
      <label className="field-label">Full name<input name="full_name" autoComplete="name" defaultValue={p?.full_name || ""} /></label>
      <label className="field-label">Business<input name="business_name" autoComplete="organization" defaultValue={p?.business_name || ""} /></label>
      <label className="field-label">Title<input name="title" placeholder="Owner, Agent, Founder…" defaultValue={p?.title || ""} /></label>
    </div>
    <div className="field-grid">
      <label className="field-label">Industry<input name="industry" placeholder="Insurance, Real estate…" defaultValue={p?.industry || ""} /></label>
      <label className="field-label">City<input name="city" defaultValue={p?.city || ""} /></label>
      <label className="field-label">Phone (private)<input name="phone" type="tel" defaultValue={p?.phone || ""} /></label>
    </div>
    <div className="field-grid">
      <label className="field-label">Website<input name="website" defaultValue={p?.website || ""} /></label>
      <label className="field-label">LinkedIn<input name="linkedin" defaultValue={p?.linkedin || ""} /></label>
    </div>
    <label className="field-label">What you do & who you want to meet<textarea name="bio" rows={3} defaultValue={p?.bio || ""} /></label>
    <label className="terms-check"><input type="checkbox" name="directory_visible" defaultChecked={p?.directory_visible} /><span>List me in the public member directory and let members send me referrals. Your email and phone stay private.</span></label>
    {state?.error && <p className="form-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="form-ok">{state.message}</p>}
    <button className="button submit-button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
  </form>;
}

export function ReferralForm({ members }: { members: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendReferral, null);
  return <form className="panel-form" action={action} key={state?.ok ? state.message : "form"}>
    <label className="field-label">Refer to<select name="to_user" required defaultValue=""><option value="" disabled>Choose a member</option>{members.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
    <label className="field-label">Contact name<input name="contact_name" required /></label>
    <div className="field-grid"><label className="field-label">Contact email<input name="contact_email" type="email" /></label><label className="field-label">Contact phone<input name="contact_phone" type="tel" /></label></div>
    <label className="field-label">What they need<textarea name="notes" rows={2} /></label>
    {state?.error && <p className="form-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="form-ok">{state.message}</p>}
    <button className="button submit-button" type="submit" disabled={pending || !members.length}>{pending ? "Sending…" : "Send referral"}</button>
  </form>;
}
