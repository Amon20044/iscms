"use client";

import { TrendingUp, DollarSign, Activity, ShoppingBag } from "lucide-react";
import type { FinancialKpis } from "@/lib/analytics/types";

function fmt(n: number, compact = false) {
  if (compact && n >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(1)}M`;
  if (compact && n >= 1_000)
    return `$${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const CARDS = (kpis: FinancialKpis) => [
  {
    label: "Total Revenue",
    value: fmt(kpis.totalRevenue, true),
    sub: `${kpis.deliveredOrderCount} delivered orders`,
    icon: DollarSign,
    tone: "teal" as const,
  },
  {
    label: "Gross Profit",
    value: fmt(kpis.grossProfit, true),
    sub: `${kpis.grossMarginPct.toFixed(1)}% margin`,
    icon: TrendingUp,
    tone: kpis.grossProfit >= 0 ? ("green" as const) : ("red" as const),
  },
  {
    label: "Pipeline Value",
    value: fmt(kpis.pipelineValue, true),
    sub: "Assigned + in-transit",
    icon: Activity,
    tone: "amber" as const,
  },
  {
    label: "Avg Order Value",
    value: fmt(kpis.avgOrderValue, true),
    sub: "Per delivered order",
    icon: ShoppingBag,
    tone: "slate" as const,
  },
];

const TONE_STYLES = {
  teal:  { icon: "bg-[#184d49]/10 text-[#184d49]", value: "text-[#184d49]" },
  green: { icon: "bg-[#3d5e31]/10 text-[#3d5e31]", value: "text-[#3d5e31]" },
  amber: { icon: "bg-[#b78a2c]/10 text-[#7a5c17]", value: "text-[#7a5c17]" },
  slate: { icon: "bg-slate-900/8 text-slate-600",   value: "text-slate-900" },
  red:   { icon: "bg-[#cb5e4a]/10 text-[#8f3e31]", value: "text-[#8f3e31]" },
};

export function KpiCards({ kpis }: { kpis: FinancialKpis }) {
  const cards = CARDS(kpis);
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const styles = TONE_STYLES[card.tone];
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="glass-panel flex flex-col gap-4 rounded-[2rem] p-5 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <p className="section-kicker">{card.label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${styles.icon}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className={`text-3xl font-semibold tabular-nums tracking-tight ${styles.value}`}>
                {card.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
