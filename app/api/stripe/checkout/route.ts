import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27ts",
});

export async function POST(request: NextRequest) {
  try {
    const { planId, tenantId, successUrl, cancelUrl } = await request.json();

    // 1. Get Tenant Details
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("name, admin_email, stripe_customer_id")
      .eq("id", tenantId)
      .single();

    if (!tenant) throw new Error("Tenant not found");

    let customerId = tenant.stripe_customer_id;

    // 2. Create Stripe Customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.admin_email,
        name: tenant.name,
        metadata: { tenantId },
      });
      customerId = customer.id;
      
      await supabaseAdmin
        .from("tenants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenantId);
    }

    // 3. Get Plan Price ID
    const { data: plan } = await supabaseAdmin
      .from("platform_plans")
      .select("stripe_price_id")
      .eq("code", planId)
      .single();

    if (!plan?.stripe_price_id) throw new Error("Plan price not configured in Stripe");

    // 4. Create Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { tenantId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
