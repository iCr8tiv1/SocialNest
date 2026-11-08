import { EventForm, SavedNotice } from "@/components/admin-forms";

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <>
    <div className="admin-title"><div><p className="eyebrow"><a href="/admin/events">Events</a></p><h1>New event</h1></div></div>
    <SavedNotice error={error} />
    <section className="admin-card"><EventForm /></section>
  </>;
}
