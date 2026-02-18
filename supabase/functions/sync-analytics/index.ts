// Supabase Edge Function: sync-analytics
// Aggregates latest platform KPIs for superadmin dashboards.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const [{ count: tenants }, { count: activeSubscriptions }, { count: bookings }, { count: aiBookings }] =
    await Promise.all([
      admin.from("tenants").select("id", { count: "exact", head: true }),
      admin.from("tenant_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("tenant_activity").select("id", { count: "exact", head: true }).eq("action", "appointment_booked"),
      admin.from("tenant_activity").select("id", { count: "exact", head: true }).eq("action", "appointment_booked_ai")
    ]);

  return new Response(
    JSON.stringify({
      tenants: tenants ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      bookings: bookings ?? 0,
      aiBookings: aiBookings ?? 0
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
