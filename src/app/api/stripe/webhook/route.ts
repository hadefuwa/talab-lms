import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const config = { api: { bodyParser: false } };

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err}` }, { status: 400 });
  }

  const supabase = await createClient();

  // Idempotency check
  const { data: existing } = await (supabase as any)
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record the event
  await (supabase as any)
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });

  const orgId = (event.data.object as any)?.metadata?.org_id;

  switch (event.type) {
    case "checkout.session.completed": {
      if (orgId) {
        await (supabase as any)
          .from("organizations")
          .update({ subscription_status: "active" })
          .eq("id", orgId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const subOrgId = sub.metadata?.org_id;
      if (subOrgId) {
        const status =
          sub.status === "active" ? "active" :
          sub.status === "trialing" ? "trialing" : "inactive";
        await (supabase as any)
          .from("organizations")
          .update({ subscription_status: status })
          .eq("id", subOrgId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const subOrgId = sub.metadata?.org_id;
      if (subOrgId) {
        await (supabase as any)
          .from("organizations")
          .update({ subscription_status: "inactive" })
          .eq("id", subOrgId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = invoice.customer as string;
      const { data: orgs } = await (supabase as any)
        .from("organizations")
        .select("id")
        .eq("stripe_customer_id", customer)
        .maybeSingle();
      if (orgs?.id) {
        await (supabase as any)
          .from("organizations")
          .update({ subscription_status: "inactive" })
          .eq("id", orgs.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
