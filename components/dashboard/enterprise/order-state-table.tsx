"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { OrderStatePill } from "@/components/dashboard/status-pill";
import type { StateCount } from "@/lib/supply-chain/types";

const STATE_BAR_COLORS: Record<string, string> = {
  created:    "#5a7a9a",
  assigned:   "#184d49",
  in_transit: "#3d5e31",
  delayed:    "#b78a2c",
  reassigned: "#ca6b3f",
  delivered:  "#2b9189",
};

export function OrderStateTable({ states }: { states: StateCount[] }) {
  const router = useRouter();
  const maxCount = Math.max(...states.map((s) => s.count), 1);

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-slate-900/6 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-kicker">Workflow Health</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Order lifecycle
            </h2>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/orders")}
            className="flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-900/5">
        {states.map((state) => {
          const barW = maxCount > 0 ? (state.count / maxCount) * 100 : 0;
          const color = STATE_BAR_COLORS[state.state] ?? "#94a3b8";
          return (
            <button
              key={state.state}
              type="button"
              onClick={() => router.push("/dashboard/orders")}
              className="flex w-full cursor-pointer items-center gap-4 px-6 py-3.5 text-left transition hover:bg-white/50"
            >
              <div className="w-28 shrink-0">
                <OrderStatePill state={state.state} />
              </div>

              {/* Mini bar */}
              <div className="flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/6">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barW}%`, background: color }}
                  />
                </div>
              </div>

              <span className="w-8 text-right text-sm font-semibold tabular-nums text-slate-900">
                {state.count}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
