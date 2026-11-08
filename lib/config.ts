// Central place for environment configuration. Every feature degrades
// gracefully when a service is not configured yet, so the site still builds
// and the public pages still render.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://social-nest.com").replace(/\/$/, "");
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "info@social-nest.com";
export const TIME_ZONE = "America/New_York";

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "info@social-nest.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
export const serverDataConfigured = supabaseConfigured && Boolean(SUPABASE_SERVICE_ROLE_KEY);
export const stripeConfigured = Boolean(STRIPE_SECRET_KEY);
