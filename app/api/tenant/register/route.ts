import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

type Payload = {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  planCode: string;
  billingInterval: "month" | "year";
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia"
    })
  : null;

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as Payload;

  if (!payload.tenantName || !payload.tenantSlug || !payload.adminEmail || !payload.planCode) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin client not configured." }, { status: 500 });
  }

  const normalizedSlug = payload.tenantSlug.trim().toLowerCase();

  const { data: plan, error: planError } = await supabaseAdmin
    .from("platform_plans")
    .select("id")
    .eq("code", payload.planCode)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: "Unknown plan code." }, { status: 404 });
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .upsert(
      {
        slug: normalizedSlug,
        name: payload.tenantName,
        admin_email: payload.adminEmail,
        active: true
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: tenantError?.message ?? "Unable to upsert tenant." }, { status: 500 });
  }

  await supabaseAdmin.from("tenant_subscriptions").upsert(
    {
      tenant_id: tenant.id,
      plan_id: plan.id,
      status: "trialing"
    },
    { onConflict: "tenant_id" }
  );

  const lookupKey = `${payload.planCode}-${payload.billingInterval === "year" ? "yearly" : "monthly"}`;
  const priceList = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });

  if (!priceList.data.length) {
    return NextResponse.json({ error: `Stripe price not found for ${lookupKey}` }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: payload.adminEmail,
    line_items: [{ price: priceList.data[0].id, quantity: 1 }],
    success_url: `${appUrl}/?tenant=${normalizedSlug}&checkout=success`,
    cancel_url: `${appUrl}/?tenant=${normalizedSlug}&checkout=cancel`,
    metadata: {
      tenantSlug: normalizedSlug,
      planCode: payload.planCode,
      billingInterval: payload.billingInterval
    }
  });

  await supabaseAdmin.from("tenant_activity").insert({
    tenant_id: tenant.id,
    actor: "tenant-admin",
    action: "tenant_registration_started",
    metadata: {
      planCode: payload.planCode,
      billingInterval: payload.billingInterval
    }
  });

  return NextResponse.json({ checkoutUrl: session.url, tenantId: tenant.id });
}
