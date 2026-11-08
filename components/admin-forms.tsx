import { saveEvent, saveSpace } from "@/app/admin/actions";
import { isoToEtLocal } from "@/lib/format";
import type { EventRow, SpaceRow } from "@/lib/types";

const dollars = (cents: number | null | undefined) => (cents == null ? "" : String(cents / 100));

export function EventForm({ event }: { event?: EventRow | null }) {
  return <form className="admin-form" action={saveEvent}>
    {event && <input type="hidden" name="id" value={event.id} />}
    <div className="field-grid">
      <label className="field-label">Title<input name="title" required defaultValue={event?.title} /></label>
      <label className="field-label">Category<input name="category" list="event-categories" defaultValue={event?.category || "Networking"} /></label>
      <label className="field-label">Status<select name="status" defaultValue={event?.status || "draft"}><option value="draft">Draft (hidden)</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></label>
    </div>
    <datalist id="event-categories"><option>Networking</option><option>Workshop</option><option>Open house</option><option>Partner program</option><option>Social</option><option>Content day</option></datalist>
    <div className="field-grid">
      <label className="field-label">Starts (Eastern)<input name="starts_at" type="datetime-local" required defaultValue={isoToEtLocal(event?.starts_at)} /></label>
      <label className="field-label">Ends (Eastern)<input name="ends_at" type="datetime-local" defaultValue={isoToEtLocal(event?.ends_at)} /></label>
      <label className="field-label">Ticket price ($, 0 = free)<input name="price" inputMode="decimal" defaultValue={dollars(event?.price_cents ?? 0)} /></label>
    </div>
    <div className="field-grid">
      <label className="field-label">Capacity (blank = unlimited)<input name="capacity" type="number" min="1" defaultValue={event?.capacity ?? ""} /></label>
      <label className="field-label">Max tickets per order<input name="max_per_order" type="number" min="1" max="20" defaultValue={event?.max_per_order ?? 4} /></label>
      <label className="field-label">Web address<input name="slug" placeholder="auto from title" defaultValue={event?.slug} /></label>
    </div>
    <label className="field-label">Short summary<input name="summary" maxLength={300} defaultValue={event?.summary || ""} /></label>
    <label className="field-label">Description<textarea name="description" rows={7} defaultValue={event?.description || ""} /></label>
    <button className="button submit-button" type="submit">{event ? "Save event" : "Create event"}</button>
  </form>;
}

export function SpaceForm({ space }: { space?: SpaceRow | null }) {
  return <form className="admin-form" action={saveSpace}>
    {space && <input type="hidden" name="id" value={space.id} />}
    <div className="field-grid">
      <label className="field-label">Name<input name="name" required defaultValue={space?.name} /></label>
      <label className="field-label">Type<select name="kind" defaultValue={space?.kind || "private_office"}><option value="private_office">Private office</option><option value="dedicated_desk">Dedicated desk</option><option value="hot_desk">Hot desk</option><option value="meeting_room">Meeting room</option></select></label>
      <label className="field-label">Capacity (people)<input name="capacity" type="number" min="1" defaultValue={space?.capacity ?? 1} /></label>
    </div>
    <div className="field-grid">
      <label className="field-label">Hourly rate ($, blank = not offered)<input name="hourly" inputMode="decimal" defaultValue={dollars(space?.hourly_rate_cents)} /></label>
      <label className="field-label">Daily rate ($)<input name="daily" inputMode="decimal" defaultValue={dollars(space?.daily_rate_cents)} /></label>
      <label className="field-label">Monthly rate ($)<input name="monthly" inputMode="decimal" defaultValue={dollars(space?.monthly_rate_cents)} /></label>
    </div>
    <label className="field-label">Short summary<input name="summary" maxLength={300} defaultValue={space?.summary || ""} /></label>
    <label className="field-label">Description<textarea name="description" rows={5} defaultValue={space?.description || ""} /></label>
    <div className="field-grid">
      <label className="field-label">Amenities (comma separated)<input name="amenities" defaultValue={space?.amenities.join(", ")} /></label>
      <label className="field-label">Sort order<input name="sort_order" type="number" defaultValue={space?.sort_order ?? 0} /></label>
      <label className="field-label">Web address<input name="slug" placeholder="auto from name" defaultValue={space?.slug} /></label>
    </div>
    <label className="terms-check"><input type="checkbox" name="active" defaultChecked={space?.active} /><span>Show on the public Office space page and accept bookings</span></label>
    <button className="button submit-button" type="submit">{space ? "Save space" : "Create space"}</button>
  </form>;
}

export function SavedNotice({ saved, error }: { saved?: string; error?: string }) {
  if (error) return <p className="notice notice-error">{error === "missing" ? "Please fill in the required fields." : "That couldn’t be saved. Please try again."}</p>;
  if (saved) return <p className="notice">Saved.</p>;
  return null;
}
