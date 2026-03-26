"use client";

import { useActionState } from "react";
import { Truck } from "lucide-react";
import { createCarrierAction } from "@/app/dashboard/carriers/actions";
import type { CarrierFormState } from "@/lib/carriers/types";

const initialState: CarrierFormState = undefined;

const REGIONS = [
  { value: "north", label: "North Zone" },
  { value: "west", label: "West Zone" },
  { value: "south", label: "South Zone" },
  { value: "east", label: "East Zone" },
  { value: "central", label: "Central Zone" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "degraded", label: "Degraded" },
  { value: "offline", label: "Offline" },
];

export function AddCarrierForm() {
  const [state, action, pending] = useActionState(createCarrierAction, initialState);

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <p className="section-kicker">Add Carrier</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        Register a new logistics carrier
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Carriers are the logistics partners that move shipments between
        warehouses and customers across supported regions.
      </p>

      <form action={action} className="mt-7 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Carrier code
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 font-mono text-sm uppercase text-slate-800"
              name="code"
              placeholder="FEDEX-EXPRESS"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Name
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="name"
              placeholder="FedEx Express"
              required
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Initial status
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

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Avg ETA (hours)
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="averageEtaHours"
              type="number"
              min="1"
              step="1"
              placeholder="24"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Reliability (1–100)
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="reliabilityScore"
              type="number"
              min="1"
              max="100"
              step="1"
              placeholder="90"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Delay bias (hours)
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="delayBiasHours"
              type="number"
              min="0"
              step="1"
              placeholder="0"
            />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Supported regions
          </legend>
          <div className="flex flex-wrap gap-3">
            {REGIONS.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-900/10 bg-white/60 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                <input
                  type="checkbox"
                  name="supportedRegions"
                  value={r.value}
                  className="h-4 w-4 accent-[#184d49]"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

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
          <Truck className="h-4 w-4" />
          {pending ? "Registering..." : "Register carrier"}
        </button>
      </form>
    </section>
  );
}
