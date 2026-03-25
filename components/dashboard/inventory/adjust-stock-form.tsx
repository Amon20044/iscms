"use client";

import { useActionState, useState } from "react";
import { Warehouse } from "lucide-react";
import { adjustInventoryAction } from "@/app/dashboard/inventory/actions";
import type { AdjustInventoryFormState } from "@/lib/inventory/types";
import type { Product } from "@/lib/supply-chain/types";
import type { Warehouse as WarehouseType } from "@/lib/supply-chain/types";

const initialState: AdjustInventoryFormState = undefined;

export function AdjustStockForm({
  products,
  warehouses,
}: {
  products: Product[];
  warehouses: WarehouseType[];
}) {
  const [state, action, pending] = useActionState(adjustInventoryAction, initialState);
  const [selectedProductId, setSelectedProductId] = useState("");

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <p className="section-kicker">Stock Adjustment</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        Set warehouse stock levels
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Update available units and safety stock for any product–warehouse
        combination. Creates the entry if it does not exist yet.
      </p>

      <form action={action} className="mt-7 grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Product
          </span>
          <select
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            name="productId"
            defaultValue=""
            required
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="" disabled>
              Select a product
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.organizationCode}] {p.name} — {p.sku}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Warehouse
          </span>
          <select
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            name="warehouseId"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select a warehouse
            </option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} — {w.city}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Available units
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm tabular-nums text-slate-800"
              name="availableUnits"
              type="number"
              min="0"
              step="1"
              placeholder="500"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Safety stock
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm tabular-nums text-slate-800"
              name="safetyStock"
              type="number"
              min="0"
              step="1"
              placeholder="100"
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={pending}
          type="submit"
        >
          <Warehouse className="h-4 w-4" />
          {pending ? "Updating stock..." : "Update stock"}
        </button>
      </form>
    </section>
  );
}
