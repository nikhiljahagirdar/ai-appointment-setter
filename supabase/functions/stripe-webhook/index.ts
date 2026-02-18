// Supabase Edge Function: stripe-webhook
// Updates tenant subscriptions from Stripe webhook events.

import Stripe from "https://esm.sh/stripe@17.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-01-27.acacia" });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenantSlug = session.metadata?.tenantSlug;
    const planCode = session.metadata?.planCode;
    const billingInterval = session.metadata?.billingInterval === "year" ? "year" : "month";

    if (tenantSlug && planCode) {
      const { data: tenant } = await admin.from("tenants").select("id").eq("slug", tenantSlug).single();
      const { data: plan } = await admin.from("platform_plans").select("id").eq("code", planCode).single();

      if (tenant && plan) {
        await admin.from("tenant_subscriptions").upsert(
          {
            tenant_id: tenant.id,
            plan_id: plan.id,
            billing_interval: billingInterval,
            status: "active",
            stripe_subscription_id: String(session.subscription ?? "") || null,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (billingInterval === "year" ? 31536000000 : 2592000000)).toISOString()
          },
          { onConflict: "tenant_id" }
        );

        await admin.from("tenant_activity").insert({
          tenant_id: tenant.id,
          actor: "stripe-webhook",
          action: "subscription_activated",
          metadata: { planCode, billingInterval }
        });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
