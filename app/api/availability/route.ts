import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, supabase } from "@/lib/supabase";

type TenantPlan = {
  plan_code: string;
  ai_enabled: boolean;
  voice_enabled: boolean;
};

async function resolveTenantPlan(tenantSlug: string): Promise<TenantPlan | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("v_tenant_plan_status")
    .select("plan_code, ai_enabled, voice_enabled")
    .eq("slug", tenantSlug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as TenantPlan;
}

export async function POST(req: NextRequest) {
  const { date, timezone, tenantSlug } = await req.json();

  if (!date) {
    return NextResponse.json({ error: "A date is required." }, { status: 400 });
  }

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug is required." }, { status: 400 });
  }

  if (!hasSupabase || !supabase) {
    return NextResponse.json({
      mode: "mock",
      plan: { plan_code: "voice-pro", ai_enabled: false, voice_enabled: true },
      slots: ["09:00", "11:30", "14:15", "16:00"],
      message:
        "Supabase keys are not configured. Using mock availability data for demo purposes."
    });
  }

  const plan = await resolveTenantPlan(tenantSlug);
  if (!plan) {
    return NextResponse.json({ error: "Unknown tenant or plan not configured." }, { status: 404 });
  }

  const { data: tenantRow, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenantRow) {
    return NextResponse.json({ error: "Unable to resolve tenant." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("appointment_slots")
    .select("time")
    .eq("tenant_id", tenantRow.id)
    .eq("date", date)
    .eq("is_booked", false)
    .order("time", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Unable to fetch appointment availability.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    mode: "supabase",
    timezone: timezone || "UTC",
    tenantSlug,
    plan,
    slots: data.map((slot) => slot.time)
  });
}
