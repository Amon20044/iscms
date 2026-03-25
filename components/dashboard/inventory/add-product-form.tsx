"use client";

import { useActionState } from "react";
import { PackagePlus } from "lucide-react";
import { createProductAction } from "@/app/dashboard/inventory/actions";
import type { CreateProductFormState } from "@/lib/products/types";
import type { AuthenticatedUser, Organization } from "@/lib/supply-chain/types";

const initialState: CreateProductFormState = undefined;

const SUGGESTED_CATEGORIES = [
  "Electronics",
  "Pharmaceuticals",
  "Food & Beverage",
  "Apparel",
  "Industrial",
  "Chemicals",
  "Medical Devices",
  "Other",
];

export function AddProductForm({
  viewer,
  organizations,
}: {
  viewer: AuthenticatedUser;
  organizations: Organization[];
}) {
  const [state, action, pending] = useActionState(createProductAction, initialState);

  // org_admin is always locked to their own org
  const isOrgLocked = viewer.role === "org_admin";

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <p className="section-kicker">Add Product</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        Register a new product SKU
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Products belong to an organization and are the unit of inventory and
        order tracking across the network.
      </p>

      <form action={action} className="mt-7 grid gap-4">
        {/* Organization selector */}
        {isOrgLocked ? (
          <input type="hidden" name="organizationId" value={viewer.organizationId} />
        ) : (
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Organization
            </span>
            <select
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="organizationId"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select an organization
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </label>
        )}

        {isOrgLocked && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-900/8 bg-slate-50/70 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Organization
            </span>
            <span className="ml-auto text-sm font-semibold text-slate-700">
              {viewer.organizationName} ({viewer.organizationCode})
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              SKU
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 font-mono text-sm uppercase text-slate-800"
              name="sku"
              placeholder="MED-GLOVE-L"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Product name
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="name"
              placeholder="Nitrile Gloves (Large)"
              required
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Category
          </span>
          <input
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            name="category"
            list="category-suggestions"
            placeholder="Pharmaceuticals"
            required
          />
          <datalist id="category-suggestions">
            {SUGGESTED_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Unit price (USD)
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="12.50"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Reorder point (units)
            </span>
            <input
              className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
              name="reorderPoint"
              type="number"
              min="0"
              step="1"
              placeholder="200"
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
          <PackagePlus className="h-4 w-4" />
          {pending ? "Creating product..." : "Create product"}
        </button>
      </form>
    </section>
  );
}
