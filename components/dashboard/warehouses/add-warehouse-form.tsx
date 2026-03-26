"use client";

import { useActionState } from "react";
import { Building2 } from "lucide-react";
import { createWarehouseAction } from "@/app/dashboard/warehouses/actions";
import type { WarehouseFormState } from "@/lib/warehouses/types";

const initialState: WarehouseFormState = undefined;

const REGIONS = [
  { value: "north", label: "North Zone" },
  { value: "west", label: "West Zone" },
  { value: "south", label: "South Zone" },
  { value: "east", label: "East Zone" },
  { value: "central", label: "Central Zone" },
];

export function AddWarehouseForm() {
  const [state, action, pending] = useActionState(createWarehouseAction, initialState);

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <p className="section-kicker">Add Warehouse</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        Register a new warehouse node
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Warehouses are fulfilment hubs that hold inventory and serve orders
        within a logistics region.
      </p>

      <form action={action} className="mt-7 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Warehouse code
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 font-mono text-sm uppercase text-slate-800"
              name="code"
              placeholder="WH-NORTH-01"
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
              placeholder="Northern Distribution Hub"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              City
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="city"
              placeholder="Chicago"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Region
            </span>
            <select
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="region"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select a region
              </option>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Handling hours
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="handlingHours"
              type="number"
              min="0"
              step="1"
              placeholder="12"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Capacity score (1–100)
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="capacityScore"
              type="number"
              min="1"
              max="100"
              step="1"
              placeholder="85"
              required
            />
          </label>
        </div>

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
          <Building2 className="h-4 w-4" />
          {pending ? "Registering..." : "Register warehouse"}
        </button>
      </form>
    </section>
  );
}
