import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia"
    })
  : null;

export async function POST(req: NextRequest) {
  const { tenantSlug, planCode, billingInterval } = await req.json();

  if (!tenantSlug || !planCode || !billingInterval) {
    return NextResponse.json(
      { error: "tenantSlug, planCode and billingInterval are required." },
      { status: 400 }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_APP_URL to enable checkout."
      },
      { status: 500 }
    );
  }

  const lookupKey = `${planCode}-${billingInterval === "year" ? "yearly" : "monthly"}`;

  let customerEmail = "tenant@example.com";

  if (hasSupabaseAdmin && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("admin_email")
      .eq("slug", tenantSlug)
      .single();

    if (!error && data?.admin_email) {
      customerEmail = data.admin_email;
    }
  }

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1
  });

  if (!prices.data.length) {
    return NextResponse.json(
      { error: `No Stripe price found for lookup key: ${lookupKey}` },
      { status: 404 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    success_url: `${appUrl}/?checkout=success`,
    cancel_url: `${appUrl}/?checkout=cancel`,
    line_items: [{ price: prices.data[0].id, quantity: 1 }],
    metadata: { tenantSlug, planCode, billingInterval }
  });

  return NextResponse.json({ url: session.url });
}
