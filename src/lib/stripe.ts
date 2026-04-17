import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const PLANS = {
  monthly: {
    name: "Family Monthly",
    price: process.env.STRIPE_PRICE_MONTHLY!,
    interval: "month" as const,
    amount: 1999,
  },
  annual: {
    name: "Family Annual",
    price: process.env.STRIPE_PRICE_ANNUAL!,
    interval: "year" as const,
    amount: 19999,
  },
} as const;
