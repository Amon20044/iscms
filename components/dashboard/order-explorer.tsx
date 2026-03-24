"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATE_SEQUENCE, type Order } from "@/lib/supply-chain/types";
import {
  CarrierStatusPill,
  OrderStatePill,
  PriorityPill,
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
  const [stateFilter, setStateFilter] = useState<"all" | Order["currentState"]>(
    "all"
  );
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const warehouseMap = useMemo(
    () => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])),
    [warehouses]
  );
  const carrierMap = useMemo(
    () => new Map(carriers.map((carrier) => [carrier.id, carrier])),
    [carriers]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesState =
        stateFilter === "all" || order.currentState === stateFilter;
      const haystack = `${order.orderNumber} ${order.customerName} ${order.deliveryLocation} ${order.organizationName}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      return matchesState && matchesSearch;
    });
  }, [orders, search, stateFilter]);

  async function runAction(
    orderId: string,
    action: "MARK_DELIVERED" | "ADMIN_REASSIGN"
  ) {
    setActionTarget(orderId);
    setFeedback(null);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Unable to update this order.");
      setActionTarget(null);
      return;
    }

    setFeedback(payload.message ?? "Order updated.");
    setActionTarget(null);
    startTransition(() => router.refresh());
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-kicker">Order Monitor</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Lifecycle visibility with org-aware admin overrides
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Filter the active order book, inspect each logistics lane, and trigger
            reassignment or delivery confirmation without leaving the dashboard.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <input
            className="input-surface min-w-[16rem] rounded-full px-4 py-3 text-sm text-slate-800"
            placeholder="Search order, org, customer, city"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
            stateFilter === "all"
              ? "bg-slate-900 text-white"
              : "border border-slate-900/10 bg-white/70 text-slate-600"
          }`}
          onClick={() => setStateFilter("all")}
          type="button"
        >
          All
        </button>
        {ORDER_STATE_SEQUENCE.map((state) => (
          <button
            key={state}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              stateFilter === state
                ? "bg-slate-900 text-white"
                : "border border-slate-900/10 bg-white/70 text-slate-600"
            }`}
            onClick={() => setStateFilter(state)}
            type="button"
          >
            {state.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {filteredOrders.length ? (
          filteredOrders.map((order) => {
            const warehouse = order.assignedWarehouseId
              ? warehouseMap.get(order.assignedWarehouseId)
              : null;
            const carrier = order.assignedCarrierId
              ? carrierMap.get(order.assignedCarrierId)
              : null;
            const isCurrentAction = actionTarget === order.id;

            return (
              <article
                key={order.id}
                className="rounded-[1.7rem] border border-slate-900/10 bg-white/75 p-5 shadow-[0_20px_60px_rgba(16,24,40,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {order.orderNumber}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {order.customerName}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {order.organizationName} - {order.productName} - {order.quantity} units - {order.deliveryLocation}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <OrderStatePill state={order.currentState} />
                    <PriorityPill priority={order.priority} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 rounded-[1.4rem] border border-slate-900/8 bg-[#fff9ef] p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Warehouse lane
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {warehouse
                        ? `${warehouse.name} - ${warehouse.city}`
                        : "Pending assignment"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Carrier lane
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      <span>{carrier?.name ?? "Pending carrier"}</span>
                      {carrier ? <CarrierStatusPill status={carrier.status} /> : null}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Expected delivery
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {formatDateTime(order.expectedDeliveryAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Tracking reference
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{order.trackingCode}</p>
                  </div>
                </div>

                {order.delayReason ? (
                  <div className="mt-4 rounded-2xl border border-[#cb5e4a]/20 bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3e31]">
                    {order.delayReason}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Created {formatDateTime(order.createdAt)}
                  </div>

                  {order.currentState !== "delivered" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isCurrentAction || isPending}
                        onClick={() => runAction(order.id, "ADMIN_REASSIGN")}
                        type="button"
                      >
                        {isCurrentAction ? "Working..." : "Reassign route"}
                      </button>
                      <button
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isCurrentAction || isPending}
                        onClick={() => runAction(order.id, "MARK_DELIVERED")}
                        type="button"
                      >
                        Confirm delivered
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5 text-sm text-slate-600 xl:col-span-2">
            No orders match the current search and state filters.
          </div>
        )}
      </div>

      <div className="mt-4 min-h-6 text-sm text-slate-600">{feedback}</div>
    </section>
  );
}
