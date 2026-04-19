import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export const PLANS = {
  monthly: {
    name: "Family Monthly",
    price: process.env.STRIPE_PRICE_MONTHLY ?? "",
    interval: "month" as const,
    amount: 1999,
  },
  annual: {
    name: "Family Annual",
    price: process.env.STRIPE_PRICE_ANNUAL ?? "",
    interval: "year" as const,
    amount: 19999,
  },
} as const;
