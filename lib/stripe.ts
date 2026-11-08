import "server-only";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY, stripeConfigured } from "@/lib/config";

let cached: Stripe | null = null;

export function stripe(): Stripe | null {
  if (!stripeConfigured) return null;
  cached ??= new Stripe(STRIPE_SECRET_KEY);
  return cached;
}
