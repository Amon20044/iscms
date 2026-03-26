"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { DelayAlert } from "@/lib/supply-chain/types";

export function DelayAlertPanel({ alerts }: { alerts: DelayAlert[] }) {
  const router = useRouter();

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-[1.6rem] border border-[#4f7d3f]/20 bg-[#f0faea] px-5 py-4">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3d5e31]" />
        <p className="text-sm font-semibold text-[#3d5e31]">
          All clear — no delayed orders right now.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="flex items-center gap-2.5 border-b border-[#cb5e4a]/15 bg-[#fff8f5] px-6 py-4">
        <AlertTriangle className="h-4 w-4 shrink-0 text-[#c66a3d]" />
        <div className="flex-1">
          <p className="section-kicker" style={{ color: "#b96a55" }}>Delay Alerts</p>
          <p className="mt-0.5 text-sm font-semibold text-[#8f3e31]">
            {alerts.length} order{alerts.length > 1 ? "s" : ""} outside SLA
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/orders")}
          className="flex items-center gap-1.5 rounded-full border border-[#cb5e4a]/25 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#8f3e31] transition hover:bg-white"
        >
          Investigate <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="divide-y divide-[#cb5e4a]/10">
        {alerts.slice(0, 5).map((alert) => (
          <button
            key={alert.orderId}
            type="button"
            onClick={() => router.push("/dashboard/orders")}
            className="flex w-full cursor-pointer items-start gap-4 bg-[#fff0eb]/60 px-6 py-3.5 text-left transition hover:bg-[#ffe8df]/80"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-[#8f3e31]">
                {alert.customerName}
              </p>
              <p className="mt-0.5 text-xs text-[#b96a55]">{alert.organizationName}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-[#8f3e31]">
                +{alert.hoursPastDue.toFixed(1)}h
              </p>
              <p className="mt-0.5 max-w-[140px] truncate text-xs text-[#b96a55]">
                {alert.carrierName}
              </p>
            </div>
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#cb5e4a]/50" />
          </button>
        ))}
      </div>
    </div>
  );
}
