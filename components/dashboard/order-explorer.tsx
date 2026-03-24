"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ORDER_STATE_SEQUENCE, type Order } from "@/lib/supply-chain/types";
import {
  CarrierStatusPill,
  OrderStatePill,
  PriorityPill,
  formatTokenLabel,
} from "@/components/dashboard/status-pill";

type LightweightCarrier = {
  id: string;
  name: string;
  status: "active" | "degraded" | "offline";
};

type LightweightWarehouse = {
  id: string;
  name: string;
  city: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function OrderExplorer({
  orders,
  carriers,
  warehouses,
}: {
  orders: Order[];
  carriers: LightweightCarrier[];
  warehouses: LightweightWarehouse[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | Order["currentState"]>("all");
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const warehouseMap = useMemo(
    () => new Map(warehouses.map((w) => [w.id, w])),
    [warehouses]
  );
  const carrierMap = useMemo(
    () => new Map(carriers.map((c) => [c.id, c])),
    [carriers]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesState = stateFilter === "all" || order.currentState === stateFilter;
      const haystack = `${order.orderNumber} ${order.customerName} ${order.deliveryLocation} ${order.organizationName}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      return matchesState && matchesSearch;
    });
  }, [orders, search, stateFilter]);

  async function runAction(orderId: string, action: "MARK_DELIVERED" | "ADMIN_REASSIGN") {
    setActionTarget(orderId);
    setFeedback(null);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setFeedback({ type: "error", text: payload.error ?? "Unable to update this order." });
      setActionTarget(null);
      return;
    }

    setFeedback({ type: "success", text: payload.message ?? "Order updated." });
    setActionTarget(null);
    startTransition(() => router.refresh());
  }

  const stateCounts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      map[o.currentState] = (map[o.currentState] ?? 0) + 1;
    }
    return map;
  }, [orders]);

  return (
    <div className="glass-panel overflow-hidden rounded-[2rem]">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-4 border-b border-slate-900/6 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-kicker">Order Monitor</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            {stateFilter !== "all" ? ` · ${formatTokenLabel(stateFilter)}` : ""}
          </h2>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input-surface w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 sm:w-64"
            placeholder="Order, customer, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── State filter tabs ── */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-900/6 bg-slate-50/40 px-4 py-2.5 scrollbar-none">
        {(["all", ...ORDER_STATE_SEQUENCE] as const).map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setStateFilter(state as typeof stateFilter)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              stateFilter === state
                ? "bg-slate-950 text-white"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            {state === "all" ? "All" : formatTokenLabel(state)}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              stateFilter === state ? "bg-white/20 text-white" : "bg-slate-900/8 text-slate-500"
            }`}>
              {stateCounts[state] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-slate-900/6 bg-slate-50/50">
              {["Order", "Customer", "Product & Location", "Status", "Logistics", "ETA", ""].map((h) => (
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
            {filteredOrders.length ? (
              filteredOrders.map((order) => {
                const warehouse = order.assignedWarehouseId ? warehouseMap.get(order.assignedWarehouseId) : null;
                const carrier = order.assignedCarrierId ? carrierMap.get(order.assignedCarrierId) : null;
                const isCurrentAction = actionTarget === order.id;
                const isDelayed = !!order.delayReason;

                return (
                  <>
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-white/40 ${isDelayed ? "bg-[#fff8f5]" : ""}`}
                    >
                      {/* Order # */}
                      <td className="px-5 py-4 pl-6">
                        <p className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{formatDateShort(order.createdAt)}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{order.customerName}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{order.organizationName}</p>
                      </td>

                      {/* Product */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-800">{order.productName}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {order.quantity} units · {order.deliveryLocation}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <OrderStatePill state={order.currentState} />
                          <PriorityPill priority={order.priority} />
                        </div>
                      </td>

                      {/* Logistics */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-800">
                          {warehouse ? `${warehouse.name}` : <span className="text-slate-400">Pending</span>}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">{carrier?.name ?? "No carrier"}</span>
                          {carrier && <CarrierStatusPill status={carrier.status} />}
                        </div>
                      </td>

                      {/* ETA */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">{formatDateTime(order.expectedDeliveryAt)}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">{order.trackingCode}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 pr-6">
                        {order.currentState !== "delivered" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isCurrentAction || isPending}
                              onClick={() => runAction(order.id, "ADMIN_REASSIGN")}
                              className="rounded-lg border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isCurrentAction ? "…" : "Reassign"}
                            </button>
                            <button
                              type="button"
                              disabled={isCurrentAction || isPending}
                              onClick={() => runAction(order.id, "MARK_DELIVERED")}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delivered
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Delay reason inline */}
                    {isDelayed && (
                      <tr key={`${order.id}-delay`} className="bg-[#fff0eb]">
                        <td colSpan={7} className="px-6 py-2">
                          <p className="text-xs text-[#8f3e31]">
                            ⚠ {order.delayReason}
                          </p>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">
                  No orders match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div className={`border-t px-6 py-3 text-sm font-medium ${
          feedback.type === "success"
            ? "border-[#4f7d3f]/20 bg-[#f0faea] text-[#3d5e31]"
            : "border-[#cb5e4a]/20 bg-[#fff0eb] text-[#8f3e31]"
        }`}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
