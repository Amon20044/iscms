import type { Warehouse } from "@/lib/supply-chain/types";
import { REGION_LABELS } from "@/lib/supply-chain/types";

export function WarehouseTable({ warehouses }: { warehouses: Warehouse[] }) {
  if (warehouses.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-slate-400">
        No warehouses registered yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-900/6 bg-slate-50/50">
            {["Code", "Name", "City", "Region", "Handling", "Capacity"].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900/5">
          {warehouses.map((w) => (
            <tr key={w.id} className="transition-colors hover:bg-white/40">
              <td className="px-5 py-4 pl-6">
                <span className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {w.code}
                </span>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">{w.name}</p>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm text-slate-700">{w.city}</p>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs uppercase tracking-[0.13em] text-slate-500">
                  {REGION_LABELS[w.region]}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm tabular-nums text-slate-700">{w.handlingHours}h</span>
              </td>
              <td className="px-5 py-4 pr-6">
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    w.capacityScore >= 75
                      ? "text-[#3d5e31]"
                      : w.capacityScore >= 40
                      ? "text-[#7a5c17]"
                      : "text-[#8f3e31]"
                  }`}
                >
                  {w.capacityScore}/100
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
