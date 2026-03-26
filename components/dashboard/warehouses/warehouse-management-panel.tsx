"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { WarehouseTable } from "@/components/dashboard/warehouses/warehouse-table";
import { AddWarehouseForm } from "@/components/dashboard/warehouses/add-warehouse-form";
import type { AuthenticatedUser, Warehouse } from "@/lib/supply-chain/types";

type Tab = "all" | "add";

export function WarehouseManagementPanel({
  viewer,
  warehouses,
}: {
  viewer: AuthenticatedUser;
  warehouses: Warehouse[];
}) {
  const [tab, setTab] = useState<Tab>("all");

  const canManage = viewer.role === "owner";

  const tabs: { id: Tab; label: string; icon?: React.ReactNode }[] = [
    { id: "all", label: "All Warehouses" },
    ...(canManage
      ? [{ id: "add" as Tab, label: "Add Warehouse", icon: <Building2 className="h-3.5 w-3.5" /> }]
      : []),
  ];

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-slate-900/6 px-6 py-5">
        <p className="section-kicker">Warehouse Network</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {warehouses.length} fulfilment {warehouses.length === 1 ? "hub" : "hubs"} registered
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

      <div className={tab === "all" ? "" : "p-6 sm:p-8"}>
        {tab === "all" && <WarehouseTable warehouses={warehouses} />}
        {tab === "add" && canManage && <AddWarehouseForm />}
      </div>
    </div>
  );
}
