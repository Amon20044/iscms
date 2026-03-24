"use client";

import { useActionState, useState } from "react";
import {
  Building2,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  createAdminAction,
  createOrganizationAction,
  type CreateAdminFormState,
  type CreateOrganizationFormState,
} from "@/app/dashboard/admins/actions";
import {
  USER_ROLE_LABELS,
  type InternalAccessUser,
  type Organization,
} from "@/lib/supply-chain/types";

const initialAdminState: CreateAdminFormState = undefined;
const initialOrganizationState: CreateOrganizationFormState = undefined;

export function AdminAccessPanel({
  organizations,
  users,
}: {
  organizations: Organization[];
  users: InternalAccessUser[];
}) {
  const [role, setRole] = useState<"admin" | "org_admin">("admin");
  const [organizationState, organizationAction, organizationPending] = useActionState(
    createOrganizationAction,
    initialOrganizationState
  );
  const [adminState, adminAction, adminPending] = useActionState(
    createAdminAction,
    initialAdminState
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-6">
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">Create Organization</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Register a new operating organization
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Organizations are the business boundary for org admins, products, and
            order visibility. Create the org first, then attach org admins to it.
          </p>

          <form action={organizationAction} className="mt-8 grid gap-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Organization name
              </span>
              <input
                className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
                name="name"
                placeholder="NorthPeak Health Network"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Organization code
              </span>
              <input
                className="input-surface w-full rounded-2xl px-4 py-3 text-sm uppercase text-slate-800"
                name="code"
                placeholder="NORTHPEAK"
              />
            </label>

            {organizationState?.error ? (
              <div className="rounded-2xl border border-[#cb5e4a]/18 bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3e31]">
                {organizationState.error}
              </div>
            ) : null}

            {organizationState?.success ? (
              <div className="rounded-2xl border border-[#1f5f56]/18 bg-[#ebfaf7] px-4 py-3 text-sm text-[#16514d]">
                {organizationState.success}
              </div>
            ) : null}

            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#184d49] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143f3c] disabled:cursor-not-allowed disabled:bg-[#7eb3ad]"
              disabled={organizationPending}
              type="submit"
            >
              <Building2 className="h-4 w-4" />
              {organizationPending ? "Creating organization..." : "Create organization"}
            </button>
          </form>
        </section>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <p className="section-kicker">Create Access</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Add org admins and platform admins
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Org admins must belong to one organization. Platform admins stay global
            and can operate across the full control tower.
          </p>

          <form action={adminAction} className="mt-8 grid gap-4">
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
                onChange={(event) => setRole(event.target.value as "admin" | "org_admin")}
              >
                <option value="admin">Admin</option>
                <option value="org_admin">Org Admin</option>
              </select>
            </label>

            {role === "org_admin" ? (
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Organization
                </span>
                <select
                  className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
                  defaultValue=""
                  name="organizationId"
                >
                  <option value="" disabled>
                    Select an organization
                  </option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} ({organization.code})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {role === "org_admin" && organizations.length === 0 ? (
              <div className="rounded-2xl border border-[#cb5e4a]/18 bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3e31]">
                Create at least one organization before adding an org admin.
              </div>
            ) : null}

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

            {adminState?.error ? (
              <div className="rounded-2xl border border-[#cb5e4a]/18 bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3e31]">
                {adminState.error}
              </div>
            ) : null}

            {adminState?.success ? (
              <div className="rounded-2xl border border-[#1f5f56]/18 bg-[#ebfaf7] px-4 py-3 text-sm text-[#16514d]">
                {adminState.success}
              </div>
            ) : null}

            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={adminPending || (role === "org_admin" && organizations.length === 0)}
              type="submit"
            >
              <UserPlus className="h-4 w-4" />
              {adminPending ? "Creating access..." : "Create admin access"}
            </button>
          </form>
        </section>
      </div>

      <div className="space-y-6">
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Organization Directory</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                Active organizations
              </h2>
            </div>
            <div className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700">
              {organizations.length} orgs
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {organizations.length ? (
              organizations.map((organization) => (
                <article key={organization.id} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {organization.name}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {organization.code}
                      </p>
                    </div>
                    <div className="rounded-full border border-slate-900/10 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Operational scope
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5 text-sm text-slate-600">
                No organizations yet. Create one to start onboarding org admins.
              </div>
            )}
          </div>
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
              <article key={user.id} className="data-tile rounded-[1.6rem] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-900">
                        {user.name}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{user.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {user.organizationName ?? "Platform-wide access"}
                    </p>
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
    </div>
  );
}
