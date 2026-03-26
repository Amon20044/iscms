"use client";

import { useState } from "react";
import { RefreshCw, Truck } from "lucide-react";
import { CarrierTable } from "@/components/dashboard/carriers/carrier-table";
import { AddCarrierForm } from "@/components/dashboard/carriers/add-carrier-form";
import { SetCarrierStatusForm } from "@/components/dashboard/carriers/set-carrier-status-form";
import type { AuthenticatedUser, Carrier } from "@/lib/supply-chain/types";

type Tab = "all" | "add" | "status";

export function CarrierManagementPanel({
  viewer,
  carriers,
}: {
  viewer: AuthenticatedUser;
  carriers: Carrier[];
}) {
  const [tab, setTab] = useState<Tab>("all");

  const canManage = viewer.role === "owner";

  const tabs: { id: Tab; label: string; icon?: React.ReactNode }[] = [
    { id: "all", label: "All Carriers" },
    ...(canManage
      ? [
          { id: "add" as Tab, label: "Add Carrier", icon: <Truck className="h-3.5 w-3.5" /> },
          { id: "status" as Tab, label: "Update Status", icon: <RefreshCw className="h-3.5 w-3.5" /> },
        ]
      : []),
  ];

  const activeCount = carriers.filter((c) => c.status === "active").length;
  const degradedCount = carriers.filter((c) => c.status === "degraded").length;

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-slate-900/6 px-6 py-5">
        <p className="section-kicker">Carrier Mesh</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {carriers.length} {carriers.length === 1 ? "carrier" : "carriers"} —{" "}
            <span className="text-[#3d5e31]">{activeCount} active</span>
            {degradedCount > 0 && (
              <span className="text-[#7a5c17]">, {degradedCount} degraded</span>
            )}
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
        {tab === "all" && <CarrierTable carriers={carriers} />}
        {tab === "add" && canManage && <AddCarrierForm />}
        {tab === "status" && canManage && <SetCarrierStatusForm carriers={carriers} />}
      </div>
    </div>
  );
}
