export type FormState = { ok?: boolean; error?: string; message?: string; code?: string } | null;

export function str(form: FormData, key: string, max = 500) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function int(form: FormData, key: string, fallback = 0) {
  const n = Number.parseInt(str(form, key, 20), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function centsFrom(form: FormData, key: string): number | null {
  const raw = str(form, key, 20).replace(/[$,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
