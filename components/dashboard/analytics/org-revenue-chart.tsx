"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OrgRevenue } from "@/lib/analytics/types";

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
      <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-5 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-slate-900">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function OrgRevenueChart({ data }: { data: OrgRevenue[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-panel overflow-hidden rounded-[2rem]">
        <div className="border-b border-slate-900/6 px-6 py-5">
          <p className="section-kicker">By Organization</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Revenue breakdown
          </h2>
        </div>
        <div className="flex h-[260px] items-center justify-center">
          <p className="text-sm text-slate-400">No revenue data yet.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((o) => ({
    ...o,
    shortName: o.orgCode,
  }));

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-slate-900/6 px-6 py-5">
        <p className="section-kicker">By Organization</p>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Revenue breakdown
          </h2>
          <div className="flex items-center gap-4">
            {[
              { color: "#184d49", label: "Revenue" },
              { color: "#3d5e31", label: "Profit" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-2 py-6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 20, bottom: 0, left: 10 }}
            barGap={4}
            barCategoryGap="32%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(23,33,51,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="shortName"
              tick={{ fontSize: 11, fill: "rgba(23,33,51,0.45)", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: "rgba(23,33,51,0.4)", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(23,33,51,0.04)" }} />
            <Bar dataKey="revenue" name="Revenue" fill="#184d49" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#184d49" fillOpacity={0.88 - i * 0.04} />
              ))}
            </Bar>
            <Bar dataKey="profit" name="Profit" fill="#3d5e31" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#3d5e31" fillOpacity={0.88 - i * 0.04} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
