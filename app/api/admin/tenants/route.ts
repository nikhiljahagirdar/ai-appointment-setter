import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return NextResponse.json({
      mode: "mock",
      tenants: [
        {
          slug: "demo-clinic",
          name: "Demo Clinic",
          plan_code: "voice-pro",
          subscription_status: "active",
          total_activity: 4
        }
      ],
      recentActivity: [
        {
          tenant_slug: "demo-clinic",
          actor: "voice-agent",
          action: "appointment_booked",
          created_at: new Date().toISOString()
        }
      ],
      message: "Supabase admin key not configured. Showing mock tenant activity."
    });
  }

  const { data: tenants, error: tenantsError } = await supabaseAdmin
    .from("v_tenant_plan_status")
    .select("slug,name,plan_code,subscription_status")
    .order("name", { ascending: true });

  if (tenantsError) {
    return NextResponse.json({ error: tenantsError.message }, { status: 500 });
  }

  const { data: recentActivity, error: activityError } = await supabaseAdmin
    .from("tenant_activity")
    .select("actor,action,created_at,tenant_id,tenants!inner(slug)")
    .order("created_at", { ascending: false })
    .limit(25);

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 500 });
  }

  return NextResponse.json({
    mode: "supabase",
    tenants,
    recentActivity: recentActivity.map((item) => ({
      actor: item.actor,
      action: item.action,
      created_at: item.created_at,
      tenant_slug: (item.tenants as { slug: string }).slug
    }))
  });
}
