import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return NextResponse.json({
      mode: "mock",
      kpis: {
        tenants: 1,
        activeSubscriptions: 1,
        monthlyBookings: 42,
        aiBookings: 19
      }
    });
  }

  const [{ count: tenants }, { count: activeSubscriptions }, { count: monthlyBookings }, { count: aiBookings }] =
    await Promise.all([
      supabaseAdmin.from("tenants").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("tenant_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin
        .from("tenant_activity")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setDate(1)).toISOString())
        .eq("action", "appointment_booked"),
      supabaseAdmin
        .from("tenant_activity")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setDate(1)).toISOString())
        .eq("action", "appointment_booked_ai")
    ]);

  return NextResponse.json({
    mode: "supabase",
    kpis: {
      tenants: tenants ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      monthlyBookings: monthlyBookings ?? 0,
      aiBookings: aiBookings ?? 0
    }
  });
}
