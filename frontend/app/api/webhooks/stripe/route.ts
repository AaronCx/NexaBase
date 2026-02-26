import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("Stripe webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const data = event.data.object as Record<string, unknown>;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const userId = (data.metadata as Record<string, string>)?.user_id;
        if (userId) {
          await supabase
            .from("profiles")
            .update({ tier: "pro" })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const customerId = data.customer as string;
        const status = data.status as string;
        const tier = ["active", "trialing"].includes(status) ? "pro" : "free";
        if (customerId) {
          await supabase
            .from("profiles")
            .update({ tier })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const customerId = data.customer as string;
        if (customerId) {
          await supabase
            .from("profiles")
            .update({ tier: "free" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "invoice.paid": {
        // Reset usage on successful renewal
        const customerId = data.customer as string;
        if (customerId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({
                messages_used_this_month: 0,
                usage_period_start: new Date().toISOString(),
              })
              .eq("id", profile.id);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const customerId = data.customer as string;
        if (customerId) {
          await supabase
            .from("profiles")
            .update({ tier: "free" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error("Error processing Stripe event:", err);
    return NextResponse.json(
      { error: "Internal error processing webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
