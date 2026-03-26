"use client";

import { useRouter } from "next/navigation";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PipelineSlice } from "@/lib/analytics/types";

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STATE_COLORS: Record<string, string> = {
  created:    "#5a7a9a",
  assigned:   "#184d49",
  in_transit: "#3d5e31",
  delayed:    "#b78a2c",
  reassigned: "#ca6b3f",
  delivered:  "#2b9189",
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PipelineSlice }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-[rgba(255,250,240,0.97)] px-4 py-3 shadow-xl backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold text-slate-700">{p.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-5 text-xs">
          <span className="text-slate-500">Orders</span>
          <span className="font-semibold text-slate-900">{p.count}</span>
        </div>
        <div className="flex items-center justify-between gap-5 text-xs">
          <span className="text-slate-500">Value</span>
          <span className="font-semibold text-[#184d49]">{fmt(p.value)}</span>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">Click to view orders →</p>
      </div>
    </div>
  );
}

export function PipelineChart({ data }: { data: PipelineSlice[] }) {
  const router = useRouter();
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-slate-900/6 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-kicker">Order Pipeline</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              State distribution
            </h2>
          </div>
          <span className="rounded-full border border-slate-900/8 bg-white/60 px-3 py-1 text-xs font-semibold tabular-nums text-slate-500">
            {total} orders
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-slate-400">No orders in scope.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 px-6 py-6 sm:flex-row">
          {/* Donut — click slice navigates to orders */}
          <div className="shrink-0">
            <ResponsiveContainer width={168} height={168}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                  strokeWidth={0}
                  cursor="pointer"
                  onClick={() => router.push("/dashboard/orders")}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.state}
                      fill={STATE_COLORS[entry.state] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend rows — each row also navigates */}
          <div className="flex w-full flex-col gap-2">
            {data.map((entry) => {
              const pct = total > 0 ? ((entry.count / total) * 100).toFixed(0) : "0";
              const color = STATE_COLORS[entry.state] ?? "#94a3b8";
              return (
                <button
                  key={entry.state}
                  type="button"
                  onClick={() => router.push("/dashboard/orders")}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/60"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: color }}
                  />
                  <span className="flex-1 text-sm text-slate-700">{entry.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {entry.count}
                  </span>
                  <span className="w-9 text-right text-xs tabular-nums text-slate-400">
                    {pct}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
