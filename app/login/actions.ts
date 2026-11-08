"use server";

import { SITE_URL } from "@/lib/config";
import { EMAIL_RE, str, type FormState } from "@/lib/forms";
import { createSessionClient } from "@/lib/supabase/server";

function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export async function sendSignInLink(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email", 200).toLowerCase();
  const next = safeNext(str(form, "next", 300) || "/account");
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  const supabase = await createSessionClient();
  if (!supabase) return { error: "Sign-in isn't available yet." };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: true },
  });
  if (error) return { error: error.status === 429 ? "Too many sign-in emails were sent. Please wait a minute and try again." : "We couldn't send the sign-in link. Please try again." };
  return { ok: true, message: email };
}
