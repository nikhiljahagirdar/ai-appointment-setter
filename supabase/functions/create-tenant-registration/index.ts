// Supabase Edge Function: create-tenant-registration
// Handles tenant bootstrap before Stripe checkout.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { tenantName, tenantSlug, adminEmail, planCode, billingInterval } = body;

    if (!tenantName || !tenantSlug || !adminEmail || !planCode) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRole);

    const { data: plan } = await admin
      .from("platform_plans")
      .select("id")
      .eq("code", planCode)
      .single();

    if (!plan) return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 404 });

    const { data: tenant, error: tenantErr } = await admin
      .from("tenants")
      .upsert(
        {
          slug: String(tenantSlug).toLowerCase(),
          name: tenantName,
          admin_email: adminEmail,
          active: true
        },
        { onConflict: "slug" }
      )
      .select("id,slug")
      .single();

    if (tenantErr || !tenant) {
      return new Response(JSON.stringify({ error: tenantErr?.message ?? "Tenant upsert failed" }), {
        status: 500
      });
    }

    await admin.from("tenant_subscriptions").upsert(
      {
        tenant_id: tenant.id,
        plan_id: plan.id,
        status: "trialing",
        billing_interval: billingInterval === "year" ? "year" : "month"
      },
      { onConflict: "tenant_id" }
    );

    await admin.from("tenant_activity").insert({
      tenant_id: tenant.id,
      actor: "edge-function",
      action: "tenant_registration_initialized",
      metadata: { planCode, billingInterval }
    });

    return new Response(JSON.stringify({ ok: true, tenantId: tenant.id, tenantSlug: tenant.slug }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
