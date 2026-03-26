import type { Carrier } from "@/lib/supply-chain/types";
import { REGION_LABELS, CARRIER_STATUS_LABELS } from "@/lib/supply-chain/types";
import { CarrierStatusPill } from "@/components/dashboard/status-pill";

export function CarrierTable({ carriers }: { carriers: Carrier[] }) {
  if (carriers.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-slate-400">
        No carriers registered yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-900/6 bg-slate-50/50">
            {["Code", "Name", "Status", "ETA Baseline", "Reliability", "Delay Bias", "Regions"].map((h) => (
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
          {carriers.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-white/40">
              <td className="px-5 py-4 pl-6">
                <span className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {c.code}
                </span>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
              </td>
              <td className="px-5 py-4">
                <CarrierStatusPill status={c.status} />
              </td>
              <td className="px-5 py-4">
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                  {c.averageEtaHours}h
                </span>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    c.reliabilityScore >= 85
                      ? "text-[#3d5e31]"
                      : c.reliabilityScore >= 65
                      ? "text-[#7a5c17]"
                      : "text-[#8f3e31]"
                  }`}
                >
                  {c.reliabilityScore}/100
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm tabular-nums text-slate-600">
                  +{c.delayBiasHours}h
                </span>
              </td>
              <td className="px-5 py-4 pr-6">
                <div className="flex flex-wrap gap-1">
                  {c.supportedRegions.map((r) => (
                    <span
                      key={r}
                      className="inline-block rounded-full border border-slate-900/10 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                    >
                      {REGION_LABELS[r] ?? r}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
