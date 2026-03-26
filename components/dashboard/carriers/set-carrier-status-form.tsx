"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { setCarrierStatusAction } from "@/app/dashboard/carriers/actions";
import type { CarrierFormState } from "@/lib/carriers/types";
import type { Carrier } from "@/lib/supply-chain/types";

const initialState: CarrierFormState = undefined;

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "degraded", label: "Degraded" },
  { value: "offline", label: "Offline" },
];

export function SetCarrierStatusForm({ carriers }: { carriers: Carrier[] }) {
  const [state, action, pending] = useActionState(setCarrierStatusAction, initialState);

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <p className="section-kicker">Update Status</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        Set carrier operational status
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Mark a carrier as degraded or offline to exclude it from new order
        assignments until it recovers.
      </p>

      <form action={action} className="mt-7 grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Carrier
          </span>
          <select
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            name="carrierId"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select a carrier
            </option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) — currently {c.status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            New status
          </span>
          <select
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            name="status"
            defaultValue="active"
            required
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {state?.error && (
          <div className="rounded-2xl border border-[#cb5e4a]/18 bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3e31]">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-2xl border border-[#1f5f56]/18 bg-[#ebfaf7] px-4 py-3 text-sm text-[#16514d]">
            {state.success}
          </div>
        )}

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#184d49] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143f3c] disabled:cursor-not-allowed disabled:bg-[#7eb3ad]"
          disabled={pending}
          type="submit"
        >
          <RefreshCw className="h-4 w-4" />
          {pending ? "Updating..." : "Update status"}
        </button>
      </form>
    </section>
  );
}
