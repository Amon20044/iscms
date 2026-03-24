"use client";

import { useActionState } from "react";
import { KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import {
  createAdminAction,
  type CreateAdminFormState,
} from "@/app/dashboard/admins/actions";
import {
  USER_ROLE_LABELS,
  type InternalAccessUser,
} from "@/lib/supply-chain/types";

const initialState: CreateAdminFormState = undefined;

export function AdminAccessPanel({
  users,
}: {
  users: InternalAccessUser[];
}) {
  const [state, action, pending] = useActionState(
    createAdminAction,
    initialState
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="section-kicker">Create Access</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Add org admins and operations admins
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Owner accounts control who can enter the control tower. This form
          provisions password-based access directly in Neon and maps the user to
          the correct RBAC tier.
        </p>

        <form action={action} className="mt-8 grid gap-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Full name
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="name"
              placeholder="Nandish Chauhan"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Email
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="email"
              placeholder="ops.admin@srs.local"
              type="email"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Role
            </span>
            <select
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              defaultValue="admin"
              name="role"
            >
              <option value="admin">Admin</option>
              <option value="org_admin">Org Admin</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Temporary password
            </span>
            <div className="input-surface flex items-center gap-3 rounded-2xl px-4 py-3">
              <KeyRound className="h-4 w-4 text-slate-500" />
              <input
                className="w-full bg-transparent text-sm text-slate-800 outline-none"
                name="password"
                placeholder="Create a secure password"
                type="password"
              />
            </div>
          </label>

          {state?.error ? (
            <div className="rounded-2xl border border-[#cb5e4a]/18 bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3e31]">
              {state.error}
            </div>
          ) : null}

          {state?.success ? (
            <div className="rounded-2xl border border-[#1f5f56]/18 bg-[#ebfaf7] px-4 py-3 text-sm text-[#16514d]">
              {state.success}
            </div>
          ) : null}

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={pending}
            type="submit"
          >
            <UserPlus className="h-4 w-4" />
            {pending ? "Creating access..." : "Create admin access"}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Current Access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Internal team directory
            </h2>
          </div>
          <div className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700">
            {users.length} internal users
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {users.map((user) => (
            <article
              key={user.id}
              className="data-tile rounded-[1.6rem] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-900">
                      {user.name}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{user.email}</p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {USER_ROLE_LABELS[user.role]}
                </div>
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
                Access created {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(user.createdAt))}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
