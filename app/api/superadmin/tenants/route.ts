import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return NextResponse.json({
      mode: "mock",
      data: [
        { slug: "demo-clinic", name: "Demo Clinic", plan_code: "voice-pro", subscription_status: "active" }
      ]
    });
  }

  const { data, error } = await supabaseAdmin
    .from("v_tenant_plan_status")
    .select("slug,name,plan_code,subscription_status,active,current_period_end")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode: "supabase", data });
}
