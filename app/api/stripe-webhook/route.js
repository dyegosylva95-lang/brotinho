import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const customerId = session.customer;
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          plan: "premium",
          stripe_customer_id: customerId,
          premium_since: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const customerId = event.data.object.customer;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();
    if (data) {
      await supabase
        .from("profiles")
        .update({ plan: "free", premium_since: null })
        .eq("id", data.id);
    }
  }

  if (event.type === "invoice.paid") {
    const customerId = event.data.object.customer;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();
    if (data) {
      await supabase
        .from("profiles")
        .update({ plan: "premium" })
        .eq("id", data.id);
    }
  }

  return NextResponse.json({ received: true });
}