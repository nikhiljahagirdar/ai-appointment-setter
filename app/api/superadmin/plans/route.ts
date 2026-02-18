import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return NextResponse.json({
      mode: "mock",
      data: [
        {
          code: "starter",
          name: "Starter",
          monthly_price_cents: 2900,
          yearly_price_cents: 29000,
          ai_enabled: false,
          voice_enabled: false
        }
      ]
    });
  }

  const { data, error } = await supabaseAdmin
    .from("platform_plans")
    .select("id,code,name,monthly_price_cents,yearly_price_cents,ai_enabled,voice_enabled")
    .order("monthly_price_cents", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode: "supabase", data });
}

export async function PUT(req: NextRequest) {
  const payload = await req.json();
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin not configured." }, { status: 500 });
  }

  const { id, name, monthly_price_cents, yearly_price_cents, ai_enabled, voice_enabled } = payload;

  const { data, error } = await supabaseAdmin
    .from("platform_plans")
    .update({ name, monthly_price_cents, yearly_price_cents, ai_enabled, voice_enabled })
    .eq("id", id)
    .select("id,code,name,monthly_price_cents,yearly_price_cents,ai_enabled,voice_enabled")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
