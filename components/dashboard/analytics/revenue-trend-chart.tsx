"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyTick } from "@/lib/analytics/types";

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-[rgba(255,250,240,0.97)] px-4 py-3 shadow-xl backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-xs font-semibold tabular-nums text-slate-900">
            {fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueTrendChart({ data }: { data: MonthlyTick[] }) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-slate-900/6 px-6 py-5">
        <p className="section-kicker">Revenue &amp; Profit</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            12-month trend
          </h2>
          <div className="flex items-center gap-4">
            {[
              { color: "#184d49", label: "Revenue" },
              { color: "#b78a2c", label: "COGS" },
              { color: "#3d5e31", label: "Profit" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: item.color, opacity: 0.8 }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 py-6">
        {!hasData ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-slate-400">No delivered orders in the last 12 months.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 4, right: 20, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#184d49" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#184d49" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="grad-profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3d5e31" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#3d5e31" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="grad-cogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b78a2c" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#b78a2c" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(23,33,51,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "rgba(23,33,51,0.4)", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fontSize: 11, fill: "rgba(23,33,51,0.4)", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#184d49"
                strokeWidth={2.5}
                fill="url(#grad-revenue)"
                dot={false}
                activeDot={{ r: 4, fill: "#184d49", strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="cogs"
                name="COGS"
                stroke="#b78a2c"
                strokeWidth={2}
                strokeDasharray="5 3"
                fill="url(#grad-cogs)"
                dot={false}
                activeDot={{ r: 4, fill: "#b78a2c", strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#3d5e31"
                strokeWidth={2.5}
                fill="url(#grad-profit)"
                dot={false}
                activeDot={{ r: 4, fill: "#3d5e31", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
