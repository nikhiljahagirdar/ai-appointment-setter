import Link from "next/link";

export default function SuperadminHome() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold">Superadmin Control Center</h1>
      <p className="mt-2 text-slate-300">Manage tenants, plans, and platform analytics.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/superadmin/tenants" className="glass rounded-2xl p-5">Tenant Management</Link>
        <Link href="/superadmin/plans" className="glass rounded-2xl p-5">Plan Editor</Link>
        <Link href="/superadmin/analytics" className="glass rounded-2xl p-5">Platform Analytics</Link>
      </div>
    </main>
  );
}
