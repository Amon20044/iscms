import Link from "next/link";
import { ArrowLeft, Building2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AdminAccessPanel } from "@/components/dashboard/admin-access-panel";
import {
  listInternalAccessUsers,
  listOrganizations,
  requireOwnerUser,
} from "@/lib/auth/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminsPage() {
  const viewer = await requireOwnerUser();
  const [users, organizations] = await Promise.all([
    listInternalAccessUsers(),
    listOrganizations(),
  ]);
  const orgAdminCount = users.filter((user) => user.role === "org_admin").length;

  return (
    <main className="relative z-10 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="glass-panel rounded-[2.6rem] p-7 sm:p-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="section-kicker">Owner Access Layer</p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-slate-900">
                Organizations, team access, and admin provisioning
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600">
                Owner controls now map to the real business model: create organizations,
                attach org admins to one of those organizations, and keep platform-wide
                admins separate from org-level operations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4" />
                Signed in as {viewer.name}
              </div>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                href="/dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Control Tower
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="data-tile rounded-[1.7rem] p-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Organizations
                </p>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                {organizations.length}
              </p>
            </div>
            <div className="data-tile rounded-[1.7rem] p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Internal users
                </p>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                {users.length}
              </p>
            </div>
            <div className="data-tile rounded-[1.7rem] p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ca6b3f]" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Org admins
                </p>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                {orgAdminCount}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <AdminAccessPanel organizations={organizations} users={users} />
        </div>
      </div>
    </main>
  );
}
