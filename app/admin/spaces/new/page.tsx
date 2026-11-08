import { SavedNotice, SpaceForm } from "@/components/admin-forms";

export default async function NewSpace({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <>
    <div className="admin-title"><div><p className="eyebrow"><a href="/admin/spaces">Office space</a></p><h1>New space</h1></div></div>
    <SavedNotice error={error} />
    <section className="admin-card"><SpaceForm /></section>
  </>;
}
