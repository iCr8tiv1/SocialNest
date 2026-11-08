import "server-only";
import { NOTIFY_EMAIL, SITE_URL } from "@/lib/config";

/**
 * Best-effort email to the Social Nest inbox through the same FormSubmit
 * endpoint the site already uses. Failures never block the visitor.
 */
export async function notifyInbox(subject: string, fields: Record<string, string | number | null | undefined>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined && value !== "") body.set(key, String(value));
  }
  body.set("_subject", subject);
  body.set("_template", "table");
  body.set("_captcha", "false");
  try {
    await fetch(`https://formsubmit.co/ajax/${NOTIFY_EMAIL}`, {
      method: "POST",
      headers: { Accept: "application/json", Origin: SITE_URL, Referer: `${SITE_URL}/` },
      body,
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    // Ignore: the record is already saved in the database.
  }
}
