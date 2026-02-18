import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

type TenantRow = {
  slug: string;
  name: string;
  plan_code: string;
  subscription_status: string;
};

type ActivityRow = {
  tenant_slug: string;
  actor: string;
  action: string;
  created_at: string;
};

async function getAdminData(): Promise<{
  tenants: TenantRow[];
  recentActivity: ActivityRow[];
  message?: string;
}> {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return {
      tenants: [
        {
          slug: "demo-clinic",
          name: "Demo Clinic",
          plan_code: "voice-pro",
          subscription_status: "active"
        }
      ],
      recentActivity: [
        {
          tenant_slug: "demo-clinic",
          actor: "system",
          action: "tenant_seeded",
          created_at: new Date().toISOString()
        }
      ],
      message: "Using mock admin data. Set SUPABASE_SERVICE_ROLE_KEY for live data."
    };
  }

  const { data: tenants } = await supabaseAdmin
    .from("v_tenant_plan_status")
    .select("slug,name,plan_code,subscription_status")
    .order("name", { ascending: true });

  const { data: activity } = await supabaseAdmin
    .from("tenant_activity")
    .select("actor,action,created_at,tenants!inner(slug)")
    .order("created_at", { ascending: false })
    .limit(30);

  return {
    tenants: (tenants ?? []) as TenantRow[],
    recentActivity: (activity ?? []).map((item) => ({
      actor: item.actor,
      action: item.action,
      created_at: item.created_at,
      tenant_slug: (item.tenants as { slug: string }).slug
    }))
  };
}

export default async function AdminPage() {
  const { tenants, recentActivity, message } = await getAdminData();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold">Tenant Admin Panel</h1>
      <p className="mt-2 text-slate-300">
        View tenant plan subscriptions and activity logs across your appointment setter platform.
      </p>
      {message ? <p className="mt-3 rounded-lg bg-amber-400/20 p-3 text-amber-200">{message}</p> : null}

      <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold">Tenant Plans</h2>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Tenant</th>
                <th className="pb-2">Slug</th>
                <th className="pb-2">Plan</th>
                <th className="pb-2">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.slug} className="border-t border-slate-800">
                  <td className="py-3">{tenant.name}</td>
                  <td className="py-3">{tenant.slug}</td>
                  <td className="py-3">{tenant.plan_code ?? "-"}</td>
                  <td className="py-3">{tenant.subscription_status ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold">Recent Tenant Activity</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {recentActivity.map((entry, index) => (
            <li key={`${entry.tenant_slug}-${entry.created_at}-${index}`} className="rounded bg-slate-800/80 p-3">
              <span className="font-medium text-cyan-300">{entry.tenant_slug}</span> · {entry.actor} · {entry.action}
              <span className="ml-2 text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
