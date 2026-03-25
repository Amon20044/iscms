"use client";

import { useState } from "react";
import { PackagePlus, Warehouse } from "lucide-react";
import { AddProductForm } from "@/components/dashboard/inventory/add-product-form";
import { AdjustStockForm } from "@/components/dashboard/inventory/adjust-stock-form";
import { ProductTable } from "@/components/dashboard/inventory/product-table";
import type { AuthenticatedUser, Organization, Product } from "@/lib/supply-chain/types";
import type { Warehouse as WarehouseType } from "@/lib/supply-chain/types";

type Tab = "catalog" | "add-product" | "adjust-stock";

export function InventoryManagementPanel({
  viewer,
  products,
  organizations,
  warehouses,
}: {
  viewer: AuthenticatedUser;
  products: Product[];
  organizations: Organization[];
  warehouses: WarehouseType[];
}) {
  const [tab, setTab] = useState<Tab>("catalog");

  const canManage = viewer.role === "owner" || viewer.role === "admin" || viewer.role === "org_admin";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "catalog", label: "Product Catalog", icon: null },
    ...(canManage
      ? [
          { id: "add-product" as Tab, label: "Add Product", icon: <PackagePlus className="h-3.5 w-3.5" /> },
          { id: "adjust-stock" as Tab, label: "Adjust Stock", icon: <Warehouse className="h-3.5 w-3.5" /> },
        ]
      : []),
  ];

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      {/* Header */}
      <div className="border-b border-slate-900/6 px-6 py-5">
        <p className="section-kicker">Product &amp; Inventory Management</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {viewer.role === "org_admin"
              ? `${viewer.organizationName} products`
              : "All products across organizations"}
          </h2>
          <div className="flex gap-1 rounded-full border border-slate-900/8 bg-white/60 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className={tab === "catalog" ? "" : "p-6 sm:p-8"}>
        {tab === "catalog" && (
          <ProductTable products={products} />
        )}

        {tab === "add-product" && canManage && (
          <AddProductForm viewer={viewer} organizations={organizations} />
        )}

        {tab === "adjust-stock" && canManage && (
          <AdjustStockForm products={products} warehouses={warehouses} />
        )}
      </div>
    </div>
  );
}
