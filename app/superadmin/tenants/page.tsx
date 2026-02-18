import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

type TenantRow = {
  slug: string;
  name: string;
  plan_code: string;
  subscription_status: string;
  active: boolean;
  current_period_end: string | null;
};

async function getTenants(): Promise<TenantRow[]> {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return [
      {
        slug: "demo-clinic",
        name: "Demo Clinic",
        plan_code: "voice-pro",
        subscription_status: "active",
        active: true,
        current_period_end: null
      }
    ];
  }

  const { data } = await supabaseAdmin
    .from("v_tenant_plan_status")
    .select("slug,name,plan_code,subscription_status,active,current_period_end")
    .order("name", { ascending: true });

  return (data ?? []) as TenantRow[];
}

export default async function SuperadminTenantsPage() {
  const tenants = await getTenants();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold">Tenant Management</h1>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-slate-400">
          <tr>
            <th className="pb-2">Tenant</th>
            <th className="pb-2">Plan</th>
            <th className="pb-2">Subscription</th>
            <th className="pb-2">Active</th>
            <th className="pb-2">Current period end</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.slug} className="border-t border-slate-800">
              <td className="py-3">{tenant.name} ({tenant.slug})</td>
              <td className="py-3">{tenant.plan_code ?? "-"}</td>
              <td className="py-3">{tenant.subscription_status ?? "-"}</td>
              <td className="py-3">{tenant.active ? "Yes" : "No"}</td>
              <td className="py-3">{tenant.current_period_end ? new Date(tenant.current_period_end).toLocaleDateString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
