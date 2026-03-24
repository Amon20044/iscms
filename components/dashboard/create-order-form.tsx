"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PRIORITY_LABELS,
  REGION_LABELS,
  type AuthenticatedUser,
  type CreateOrderInput,
  type Organization,
  type Product,
} from "@/lib/supply-chain/types";

function createDefaultRequestedAt() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return copy.toISOString().slice(0, 16);
}

export function CreateOrderForm({
  defaultRequestedDeliveryAt,
  organizations,
  products,
  viewer,
}: {
  defaultRequestedDeliveryAt: string;
  organizations: Organization[];
  products: Product[];
  viewer: AuthenticatedUser;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<null | {
    text: string;
    type: "success" | "error";
  }>(null);
  const [form, setForm] = useState<CreateOrderInput>({
    customerName: "",
    organizationId: viewer.organizationId ?? organizations[0]?.id ?? "",
    productSku: "",
    quantity: 10,
    deliveryLocation: "",
    region: "north",
    priority: "standard",
    requestedDeliveryAt: defaultRequestedDeliveryAt,
  });

  const isOrgAdmin = viewer.role === "org_admin";
  const filteredProducts = useMemo(() => {
    if (!form.organizationId) {
      return [];
    }

    return products.filter((product) => product.organizationId === form.organizationId);
  }, [form.organizationId, products]);

  const resolvedProductSku = filteredProducts.some(
    (product) => product.sku === form.productSku
  )
    ? form.productSku
    : filteredProducts[0]?.sku ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        productSku: resolvedProductSku,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage({
        type: "error",
        text: payload.error ?? "Unable to create the order.",
      });
      return;
    }

    setMessage({
      type: "success",
      text: `${payload.order.orderNumber} routed for ${payload.order.organizationName}.`,
    });
    setForm((current) => ({
      ...current,
      customerName: "",
      deliveryLocation: "",
      quantity: 10,
      requestedDeliveryAt: createDefaultRequestedAt(),
      productSku: filteredProducts[0]?.sku ?? "",
    }));
    startTransition(() => router.refresh());
  }

  function updateField<Key extends keyof CreateOrderInput>(
    key: Key,
    value: CreateOrderInput[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateOrganization(organizationId: string) {
    const nextProducts = products.filter(
      (product) => product.organizationId === organizationId
    );

    setForm((current) => ({
      ...current,
      organizationId,
      productSku: nextProducts[0]?.sku ?? "",
    }));
  }

  const selectedOrganization = organizations.find(
    (organization) => organization.id === form.organizationId
  );
  const canSubmit = Boolean(
    form.organizationId && resolvedProductSku && filteredProducts.length
  );

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Order Creation</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Dispatch organization-scoped supply requests
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Orders are created inside one operating organization, validated against
            live warehouse inventory, and routed through the Drizzle orchestration layer.
          </p>
        </div>
        <div className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {isOrgAdmin ? "Org scoped" : "Multi-org"}
        </div>
      </div>

      <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Customer or request label
          </span>
          <input
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            placeholder="NorthPeak Hospitals"
            value={form.customerName}
            onChange={(event) => updateField("customerName", event.target.value)}
          />
        </label>

        {isOrgAdmin ? (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Operating organization
            </span>
            <div className="input-surface rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800">
              {viewer.organizationName}
            </div>
          </div>
        ) : (
          <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Operating organization
              </span>
              <select
                className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
                value={form.organizationId ?? ""}
                onChange={(event) => updateOrganization(event.target.value)}
              >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name} ({organization.code})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Product catalog
          </span>
          <select
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            value={resolvedProductSku}
            onChange={(event) => updateField("productSku", event.target.value)}
          >
            {filteredProducts.map((product) => (
              <option key={product.sku} value={product.sku}>
                {product.name} - {product.category}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Quantity
          </span>
          <input
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            min={1}
            type="number"
            value={form.quantity}
            onChange={(event) => updateField("quantity", Number(event.target.value))}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Region
          </span>
          <select
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            value={form.region}
            onChange={(event) =>
              updateField("region", event.target.value as CreateOrderInput["region"])
            }
          >
            {Object.entries(REGION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Priority
          </span>
          <select
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            value={form.priority}
            onChange={(event) =>
              updateField("priority", event.target.value as CreateOrderInput["priority"])
            }
          >
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Delivery location
          </span>
          <input
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            placeholder="Lucknow"
            value={form.deliveryLocation}
            onChange={(event) => updateField("deliveryLocation", event.target.value)}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Requested delivery time
          </span>
          <input
            className="input-surface w-full rounded-2xl px-4 py-3 text-sm text-slate-800"
            type="datetime-local"
            value={form.requestedDeliveryAt}
            onChange={(event) => updateField("requestedDeliveryAt", event.target.value)}
          />
        </label>

        <div className="md:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6 text-sm">
            {message ? (
              <span className={message.type === "success" ? "text-[#16514d]" : "text-[#8f3e31]"}>
                {message.text}
              </span>
            ) : filteredProducts.length ? (
              <span className="text-slate-500">
                {selectedOrganization
                  ? `The backend reserves stock and assigns a warehouse and carrier for ${selectedOrganization.name}.`
                  : "Select an organization to start."}
              </span>
            ) : (
              <span className="text-[#8f3e31]">
                No products are currently available for this organization.
              </span>
            )}
          </div>

          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isPending || !canSubmit}
            type="submit"
          >
            {isPending ? "Creating order..." : "Create and route order"}
          </button>
        </div>
      </form>
    </section>
  );
}
