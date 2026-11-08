import "server-only";
import { redirect } from "next/navigation";
import { ADMIN_EMAILS } from "@/lib/config";
import { createSessionClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string; isAdmin: boolean };

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  return { id: user.id, email, isAdmin: ADMIN_EMAILS.includes(email) };
}

export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!user.isAdmin) redirect("/account?notice=admin-only");
  return user;
}
