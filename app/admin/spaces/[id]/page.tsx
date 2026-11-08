import { notFound } from "next/navigation";
import { SavedNotice, SpaceForm } from "@/components/admin-forms";
import { adminDb } from "@/lib/supabase/admin";
import type { SpaceRow } from "@/lib/types";

export default async function EditSpace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const { data: space } = await adminDb().from("spaces").select("*").eq("id", id).maybeSingle();
  if (!space) notFound();
  return <>
    <div className="admin-title"><div><p className="eyebrow"><a href="/admin/spaces">Office space</a></p><h1>{space.name}</h1></div>{space.active && <a className="text-link" href={`/offices/${space.slug}`} target="_blank">View public page</a>}</div>
    <SavedNotice saved={saved} error={error} />
    <section className="admin-card"><SpaceForm space={space as SpaceRow} /></section>
  </>;
}
