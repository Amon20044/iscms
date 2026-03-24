import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  ShieldCheck,
  Sparkles,
  Warehouse as WarehouseIcon,
  Workflow,
} from "lucide-react";
import { AutomationConsole } from "@/components/dashboard/automation-console";
import { CreateOrderForm } from "@/components/dashboard/create-order-form";
import { OrderExplorer } from "@/components/dashboard/order-explorer";
import {
  CarrierStatusPill,
  OrderStatePill,
} from "@/components/dashboard/status-pill";
import {
  canManageAdmins,
  requireDashboardUser,
} from "@/lib/auth/service";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import {
  REGION_LABELS,
  USER_ROLE_LABELS,
  type AuthenticatedUser,
  type DashboardSnapshot,
} from "@/lib/supply-chain/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_CONTRACTS = [
  {
    endpoint: "POST /api/orders",
    description:
      "Create an order, reserve inventory, and assign warehouse and carrier.",
  },
  {
    endpoint: "PATCH /api/orders/:id",
    description:
      "Reassign an order or confirm delivery from the control tower.",
  },
  {
    endpoint: "POST /api/automation/run",
    description:
      "Run the automated delay detection and reassignment cycle.",
  },
  {
    endpoint: "GET /api/dashboard",
    description:
      "Return the live aggregate snapshot that powers the dashboard view.",
  },
] as const;

const DASHBOARD_ANCHORS = [
  { href: "/dashboard#orders", icon: Boxes, label: "Orders" },
  { href: "/dashboard#inventory", icon: WarehouseIcon, label: "Inventory" },
  { href: "/dashboard#automation", icon: Workflow, label: "Automation" },
  { href: "/dashboard#traceability", icon: Activity, label: "Traceability" },
] as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function createDefaultRequestedDeliveryAt() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return copy.toISOString().slice(0, 16);
}

async function loadDashboardSnapshot(): Promise<{
  error?: string;
  snapshot: DashboardSnapshot | null;
}> {
  try {
    return {
      snapshot: await getDashboardSnapshot(),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to load dashboard.",
      snapshot: null,
    };
  }
}

function SetupState({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="glass-panel w-full rounded-[2.5rem] p-8 sm:p-12">
        <p className="section-kicker">Neon Setup</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-slate-900">
          The control tower is ready, but the live Neon database is not wired in.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
          Add your connection string in <code>.env.local</code> and run the DB
          sync so the authenticated dashboard, RBAC, and operations data can boot.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="data-tile rounded-[1.8rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              1. Apply schema
            </p>
            <p className="mt-3 font-mono text-sm text-slate-800">
              npm run db:push -- --force
            </p>
          </div>
          <div className="data-tile rounded-[1.8rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              2. Seed owner data
            </p>
            <p className="mt-3 font-mono text-sm text-slate-800">npm run db:seed</p>
          </div>
          <div className="data-tile rounded-[1.8rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              3. Start app
            </p>
            <p className="mt-3 font-mono text-sm text-slate-800">npm run dev</p>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-[1.6rem] border border-[#cb5e4a]/25 bg-[#fff0eb] px-5 py-4 text-sm text-[#8f3e31]">
            {error}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function DashboardView({
  snapshot,
  viewer,
}: {
  snapshot: DashboardSnapshot;
  viewer: AuthenticatedUser;
}) {
  const defaultRequestedDeliveryAt = createDefaultRequestedDeliveryAt();
  const showOwnerTools = canManageAdmins(viewer.role);

  return (
    <main className="relative z-10 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="glass-panel rounded-[2.8rem] p-7 sm:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.3fr_0.95fr] xl:items-start">
            <div>
              <p className="section-kicker">Control Tower / {USER_ROLE_LABELS[viewer.role]}</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-6xl">
                Welcome back, {viewer.name.split(" ")[0]}.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                This operations workspace is organized around the real domain flow:
                create orders, watch inventory pressure, manage automation drift,
                and step into team access only when your role allows it.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2">
                  Project: srs
                </span>
                <span className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2">
                  Neon Postgres 17
                </span>
                <span className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2">
                  Drizzle ORM
                </span>
                <span className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2">
                  Role: {USER_ROLE_LABELS[viewer.role]}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {DASHBOARD_ANCHORS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900/18 hover:bg-white"
                      href={link.href}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}

                {showOwnerTools ? (
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    href="/dashboard/admins"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Team Access
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Last automation summary
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {formatDateTime(snapshot.meta.lastAutomationRunAt)}
                </p>
                <div className="mt-5 space-y-3 text-sm text-white/80">
                  {snapshot.meta.lastAutomationSummary.map((item, index) => (
                    <div
                      key={`${snapshot.meta.lastAutomationRunAt}-${index}`}
                      className="rounded-2xl bg-white/6 px-4 py-3"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {snapshot.workflowStats.map((stat) => (
                  <div key={stat.label} className="data-tile rounded-[1.8rem] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {stat.hint}
                    </p>
                  </div>
                ))}
              </div>

              {showOwnerTools ? (
                <Link
                  className="group flex items-center justify-between rounded-[1.7rem] border border-slate-900/10 bg-white/75 px-5 py-4 transition hover:border-slate-900/18 hover:bg-white"
                  href="/dashboard/admins"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Owner tools
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                      Create org admins and admin users
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-900" />
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Workflow States</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Lifecycle coverage across the orchestration engine
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {snapshot.stateCounts.map((state) => (
                <div key={state.state} className="data-tile rounded-[1.7rem] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <OrderStatePill state={state.state} />
                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                      {state.count}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {state.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#ca6b3f]" />
              <p className="section-kicker">Delay Alerts</p>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Orders outside SLA guardrails
            </h2>
            <div className="mt-6 space-y-4">
              {snapshot.delayAlerts.length ? (
                snapshot.delayAlerts.map((alert) => (
                  <div
                    key={alert.orderId}
                    className="rounded-[1.6rem] border border-[#cb5e4a]/18 bg-[#fff0eb] p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#8f3e31]">
                          {alert.customerName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#b96a55]">
                          {alert.hoursPastDue.toFixed(1)} hours past ETA
                        </p>
                      </div>
                      <CarrierStatusPill status="degraded" />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#8f3e31]">
                      {alert.reason}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#b96a55]">
                      {alert.warehouseName} - {alert.carrierName}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5 text-sm text-slate-600">
                  No orders are currently delayed.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="automation" className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr] scroll-mt-32">
          <CreateOrderForm
            defaultRequestedDeliveryAt={defaultRequestedDeliveryAt}
            products={snapshot.products}
          />
          <AutomationConsole
            lastRunAt={snapshot.meta.lastAutomationRunAt}
            summary={snapshot.meta.lastAutomationSummary}
          />
        </section>

        <section id="orders" className="mt-8 scroll-mt-32">
          <OrderExplorer
            orders={snapshot.orders}
            carriers={snapshot.carriers.map((carrier) => ({
              id: carrier.id,
              name: carrier.name,
              status: carrier.status,
            }))}
            warehouses={snapshot.warehouses.map((warehouse) => ({
              id: warehouse.id,
              name: warehouse.name,
              city: warehouse.city,
            }))}
          />
        </section>

        <section id="inventory" className="mt-8 grid gap-6 xl:grid-cols-3 scroll-mt-32">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Inventory Signals</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Stock pressure by SKU
            </h2>
            <div className="mt-6 space-y-4">
              {snapshot.inventorySignals.map((item) => (
                <div key={item.sku} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {item.sku} - {item.category}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-900/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Available</p>
                      <p className="mt-2 font-semibold text-slate-900">{item.availableUnits}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Reserved</p>
                      <p className="mt-2 font-semibold text-slate-900">{item.reservedUnits}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Primary hub</p>
                      <p className="mt-2 font-semibold text-slate-900">{item.primaryWarehouse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Warehouse Grid</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Allocation readiness
            </h2>
            <div className="mt-6 space-y-4">
              {snapshot.warehouseSignals.map((warehouse) => (
                <div key={warehouse.id} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{warehouse.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {REGION_LABELS[warehouse.region]}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold tracking-tight text-slate-900">
                      {warehouse.capacityScore}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open orders</p>
                      <p className="mt-2 font-semibold text-slate-900">{warehouse.openOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Low-stock SKUs</p>
                      <p className="mt-2 font-semibold text-slate-900">{warehouse.lowStockSkus}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Carrier Mesh</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Live logistics health
            </h2>
            <div className="mt-6 space-y-4">
              {snapshot.carrierSignals.map((carrier) => (
                <div key={carrier.id} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{carrier.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {carrier.activeOrders} active assignments
                      </p>
                    </div>
                    <CarrierStatusPill status={carrier.status} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">ETA baseline</p>
                      <p className="mt-2 font-semibold text-slate-900">{carrier.averageEtaHours}h</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Reliability</p>
                      <p className="mt-2 font-semibold text-slate-900">{carrier.reliabilityScore}/100</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="traceability" className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr] scroll-mt-32">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Traceability</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Audit trail from workflow logs
            </h2>
            <div className="mt-6 space-y-4">
              {snapshot.recentLogs.map((log) => (
                <div key={log.id} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{log.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">API Interface</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Backend contract exposed through route handlers
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              {API_CONTRACTS.map((contract) => (
                <div key={contract.endpoint} className="data-tile rounded-[1.6rem] p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
                    {contract.endpoint}
                  </p>
                  <p className="mt-3">{contract.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function DashboardPage() {
  if (!isDatabaseConfigured()) {
    return <SetupState />;
  }

  const viewer = await requireDashboardUser();
  const { snapshot, error } = await loadDashboardSnapshot();

  if (!snapshot) {
    return <SetupState error={error} />;
  }

  return <DashboardView snapshot={snapshot} viewer={viewer} />;
}
