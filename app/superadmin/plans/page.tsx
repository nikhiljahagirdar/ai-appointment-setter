import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase";

type PlanRow = {
  code: string;
  name: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  ai_enabled: boolean;
  voice_enabled: boolean;
};

async function getPlans(): Promise<PlanRow[]> {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    return [
      {
        code: "starter",
        name: "Starter",
        monthly_price_cents: 2900,
        yearly_price_cents: 29000,
        ai_enabled: false,
        voice_enabled: false
      }
    ];
  }

  const { data } = await supabaseAdmin
    .from("platform_plans")
    .select("code,name,monthly_price_cents,yearly_price_cents,ai_enabled,voice_enabled")
    .order("monthly_price_cents", { ascending: true });

  return (data ?? []) as PlanRow[];
}

export default async function SuperadminPlansPage() {
  const plans = await getPlans();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold">Plan Editor</h1>
      <p className="mt-2 text-slate-300">Use `PUT /api/superadmin/plans` to update plan pricing and capabilities.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.code} className="glass rounded-2xl p-5">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-300">Code: {plan.code}</p>
            <p className="text-sm text-slate-300">Monthly: ${(plan.monthly_price_cents / 100).toFixed(2)}</p>
            <p className="text-sm text-slate-300">Yearly: ${(plan.yearly_price_cents / 100).toFixed(2)}</p>
            <p className="text-sm text-slate-300">AI: {plan.ai_enabled ? "Enabled" : "Disabled"}</p>
            <p className="text-sm text-slate-300">Voice: {plan.voice_enabled ? "Enabled" : "Disabled"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
