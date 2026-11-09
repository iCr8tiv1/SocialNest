"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { centsFrom, EMAIL_RE, str, type FormState } from "@/lib/forms";
import { notifyInbox } from "@/lib/notify";
import { createSessionClient } from "@/lib/supabase/server";

function cleanUrl(value: string) {
  if (!value) return null;
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try { return new URL(url).toString(); } catch { return null; }
}

export async function saveProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const fullName = str(form, "full_name", 120);
  const listed = form.get("directory_visible") === "on";
  if (listed && (!fullName || !str(form, "business_name"))) return { error: "Add your name and business to appear in the directory." };
  const db = await createSessionClient();
  if (!db) return { error: "Accounts are temporarily unavailable." };
  const { error } = await db.rpc("save_my_profile", {
    p_full_name: fullName || null,
    p_phone: str(form, "phone", 40) || null,
    p_business_name: str(form, "business_name", 160) || null,
    p_title: str(form, "title", 120) || null,
    p_industry: str(form, "industry", 80) || null,
    p_website: cleanUrl(str(form, "website", 300)),
    p_linkedin: cleanUrl(str(form, "linkedin", 300)),
    p_city: str(form, "city", 80) || null,
    p_bio: str(form, "bio", 1200) || null,
    p_directory_visible: listed,
  });
  if (error) return { error: "We couldn't save your profile. Please try again." };
  revalidatePath("/account");
  revalidatePath("/network");
  return { ok: true, message: "Profile saved." };
}

export async function sendReferral(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const toUser = str(form, "to_user", 60);
  const contactName = str(form, "contact_name", 120);
  const contactEmail = str(form, "contact_email", 200);
  if (!toUser || toUser === user.id) return { error: "Choose the member you're referring to." };
  if (!contactName) return { error: "Add the name of the person you're referring." };
  if (contactEmail && !EMAIL_RE.test(contactEmail)) return { error: "That contact email doesn't look right." };
  const db = await createSessionClient();
  if (!db) return { error: "Referrals are temporarily unavailable." };
  const { data: target } = await db.from("profiles").select("id, full_name, directory_visible").eq("id", toUser).maybeSingle();
  if (!target?.directory_visible) return { error: "That member isn't accepting referrals right now." };
  const { error } = await db.from("referrals").insert({
    from_user: user.id, to_user: toUser, contact_name: contactName,
    contact_email: contactEmail || null, contact_phone: str(form, "contact_phone", 40) || null,
    notes: str(form, "notes", 1000) || null,
  });
  if (error) return { error: "We couldn't send that referral. Please try again." };
  await notifyInbox("New member referral — Social Nest", { From: user.email, To: target.full_name, Contact: contactName });
  revalidatePath("/account");
  return { ok: true, message: `Referral sent to ${target.full_name}.` };
}

export async function updateReferral(form: FormData) {
  const user = await requireUser("/account");
  const id = str(form, "id", 60);
  const status = str(form, "status", 20);
  if (!["new", "contacted", "won", "lost"].includes(status)) return;
  const db = await createSessionClient();
  if (!db) return;
  await db.from("referrals").update({ status, value_cents: status === "won" ? centsFrom(form, "value") : null })
    .eq("id", id).eq("to_user", user.id);
  revalidatePath("/account");
}
