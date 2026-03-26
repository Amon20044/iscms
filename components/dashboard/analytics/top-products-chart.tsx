"use client";

import { useRouter } from "next/navigation";
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
import type { TopProduct } from "@/lib/analytics/types";

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TopProduct }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-[rgba(255,250,240,0.97)] px-4 py-3 shadow-xl backdrop-blur-xl">
      <p className="mb-0.5 max-w-[180px] truncate text-xs font-semibold text-slate-700">
        {p.name}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-2">
        {p.sku}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-5 text-xs">
          <span className="text-slate-500">Revenue</span>
          <span className="font-semibold text-[#184d49]">{fmt(p.revenue)}</span>
        </div>
        <div className="flex items-center justify-between gap-5 text-xs">
          <span className="text-slate-500">Units sold</span>
          <span className="font-semibold text-slate-800">{p.unitsSold.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-5 text-xs">
          <span className="text-slate-500">Orders</span>
          <span className="font-semibold text-slate-800">{p.orderCount}</span>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">Click to manage inventory →</p>
      </div>
    </div>
  );
}

const BAR_COLORS = [
  "#184d49", "#1f6460", "#257a75", "#2b9189",
  "#31a89e", "#3bbfb4", "#4ad4c8",
];

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="glass-panel overflow-hidden rounded-[2rem]">
        <div className="border-b border-slate-900/6 px-6 py-5">
          <p className="section-kicker">Top Sellers</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Products by revenue
          </h2>
        </div>
        <div className="flex h-[260px] items-center justify-center">
          <p className="text-sm text-slate-400">No delivered orders yet.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((p) => ({
    ...p,
    shortName: p.name.length > 20 ? p.name.slice(0, 19) + "…" : p.name,
  }));

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-slate-900/6 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-kicker">Top Sellers</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Products by revenue
            </h2>
          </div>
          <span className="text-xs text-slate-400">Last 12 months · click to manage</span>
        </div>
      </div>
      <div className="px-2 py-5">
        <ResponsiveContainer width="100%" height={248}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 8 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(23,33,51,0.06)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: "rgba(23,33,51,0.4)", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={116}
              tick={{ fontSize: 11, fill: "rgba(23,33,51,0.55)", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(23,33,51,0.04)" }}
            />
            <Bar
              dataKey="revenue"
              name="Revenue"
              radius={[0, 6, 6, 0]}
              maxBarSize={26}
              cursor="pointer"
              onClick={() => router.push("/dashboard/inventory")}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
