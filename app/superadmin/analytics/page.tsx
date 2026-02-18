import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

async function getAnalytics() {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return {
      tenants: 1,
      activeSubscriptions: 1,
      monthlyBookings: 42,
      aiBookings: 19
    };
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
        .eq("action", "appointment_booked"),
      supabaseAdmin
        .from("tenant_activity")
        .select("id", { count: "exact", head: true })
        .eq("action", "appointment_booked_ai")
    ]);

  return {
    tenants: tenants ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    monthlyBookings: monthlyBookings ?? 0,
    aiBookings: aiBookings ?? 0
  };
}

export default async function SuperadminAnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold">Platform Analytics</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="glass rounded-xl p-4"><p className="text-sm text-slate-400">Tenants</p><p className="text-2xl font-bold">{analytics.tenants}</p></div>
        <div className="glass rounded-xl p-4"><p className="text-sm text-slate-400">Active Subscriptions</p><p className="text-2xl font-bold">{analytics.activeSubscriptions}</p></div>
        <div className="glass rounded-xl p-4"><p className="text-sm text-slate-400">Bookings</p><p className="text-2xl font-bold">{analytics.monthlyBookings}</p></div>
        <div className="glass rounded-xl p-4"><p className="text-sm text-slate-400">AI Bookings</p><p className="text-2xl font-bold">{analytics.aiBookings}</p></div>
      </div>
    </main>
  );
}
