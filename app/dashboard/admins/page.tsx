import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { AdminAccessPanel } from "@/components/dashboard/admin-access-panel";
import {
  listInternalAccessUsers,
  requireOwnerUser,
} from "@/lib/auth/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminsPage() {
  const viewer = await requireOwnerUser();
  const users = await listInternalAccessUsers();

  return (
    <main className="relative z-10 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="glass-panel rounded-[2.6rem] p-7 sm:p-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="section-kicker">Owner Access Layer</p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-slate-900">
                Team access and admin provisioning
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600">
                This route exists only for the owner role. It is linked directly
                from the navigation because access management is part of the
                product workflow, not an afterthought in settings.
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Internal users
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                {users.length}
              </p>
            </div>
            <div className="data-tile rounded-[1.7rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Owner path
              </p>
              <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                Navigation controlled
              </p>
            </div>
            <div className="data-tile rounded-[1.7rem] p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ca6b3f]" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  RBAC live
                </p>
              </div>
              <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                Create org admins and admins
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <AdminAccessPanel users={users} />
        </div>
      </div>
    </main>
  );
}
