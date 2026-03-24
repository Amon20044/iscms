import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Network,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Workflow,
  Zap,
} from "lucide-react";
import { getCurrentUser, isDashboardRole } from "@/lib/auth/service";
import { USER_ROLE_LABELS } from "@/lib/supply-chain/types";

const METRICS = [
  { value: "5-step", label: "Automated order workflow", icon: Workflow },
  { value: "3-tier", label: "Role-based access control", icon: ShieldCheck },
  { value: "Real-time", label: "Inventory & carrier tracking", icon: BarChart3 },
  { value: "Zero", label: "Manual delay escalation", icon: Zap },
] as const;

const FEATURES = [
  {
    icon: Package,
    problem: "Orders fall through the cracks",
    title: "Full-cycle order orchestration",
    description:
      "Every order moves through a controlled flow — intake, validation, warehouse assignment, dispatch, and delivery — with no manual handoffs or lost context.",
  },
  {
    icon: Warehouse,
    problem: "Stock shortages blindside operations",
    title: "Live inventory intelligence",
    description:
      "Monitor reserved units, available stock, and warehouse pressure in real time. Spot shortages before they become missed deliveries.",
  },
  {
    icon: Truck,
    problem: "Carrier delays go unnoticed until it's too late",
    title: "Automated carrier recovery",
    description:
      "The platform tracks ETA drift, flags SLA risk, and triggers carrier reassignment automatically — so your team resolves issues before customers feel them.",
  },
  {
    icon: TrendingUp,
    problem: "No one knows where an order actually is",
    title: "Complete lifecycle traceability",
    description:
      "Every action is logged. Every reassignment is recorded. From creation to delivery, you always have a complete, timestamped audit trail.",
  },
] as const;

const WORKFLOW_STEPS = [
  { step: "01", title: "Order received", desc: "Captured through the operations layer with full metadata" },
  { step: "02", title: "Inventory validated", desc: "Live warehouse stock checked before any commitment is made" },
  { step: "03", title: "Warehouse & carrier assigned", desc: "Matched by region, capacity, and current availability" },
  { step: "04", title: "Automation monitors delivery", desc: "ETA drift detected and carrier recovery triggered automatically" },
  { step: "05", title: "Traceability closed", desc: "Final delivery state logged with full lifecycle history" },
] as const;

const ACCESS_MODEL = [
  {
    icon: ShieldCheck,
    role: "Owner",
    tagline: "Full platform authority",
    description:
      "Provisions org admins, controls platform access, and has complete visibility across every workflow, team member, and operation.",
    iconBg: "bg-[#1f5f56]",
    accent: "text-[#1f5f56]",
  },
  {
    icon: Users,
    role: "Org Admin",
    tagline: "Operational command",
    description:
      "Runs the full control tower — orders, inventory, automation, and traceability — without touching platform-level provisioning.",
    iconBg: "bg-[#ca6b3f]",
    accent: "text-[#ca6b3f]",
  },
  {
    icon: Network,
    role: "Admin",
    tagline: "Day-to-day execution",
    description:
      "Handles routing, carrier reassignment, and delivery operations inside the secured dashboard. Focused, scoped, and effective.",
    iconBg: "bg-slate-700",
    accent: "text-slate-500",
  },
] as const;

const STACK_ITEMS = [
  { name: "Next.js 16", detail: "App Router · SSR · Server Actions" },
  { name: "Neon Postgres 17", detail: "Serverless · Branching · Pooling" },
  { name: "Drizzle ORM", detail: "Typed schema · Migrations · RBAC" },
  { name: "REST API", detail: "Role-scoped · Session-backed · Secure" },
] as const;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const viewer = await getCurrentUser();
  const showDashboardCta = viewer && isDashboardRole(viewer.role);

  return (
    <main className="relative z-10 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* ── Hero ── */}
        <section className="glass-panel overflow-hidden rounded-[2.8rem] p-8 sm:p-12">
          <div className="grid gap-12 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div>
              <p className="section-kicker">Inventory & Supply Chain Platform</p>
              <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
                Stop chasing delays.<br />
                Start running supply chains that deliver.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                A unified operations platform with live inventory visibility, automated carrier recovery,
                and role-based control — built for teams that can&apos;t afford to miss a delivery.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={showDashboardCta ? "/dashboard" : "/login"}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {showDashboardCta ? "Open control tower" : "Get started"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-900/20 hover:bg-white"
                >
                  See how it works
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>

              {viewer && (
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Signed in as {USER_ROLE_LABELS[viewer.role]}
                </p>
              )}
            </div>

            {/* Dark dashboard preview */}
            <div className="rounded-[2.2rem] border border-slate-900/10 bg-slate-950 p-6 shadow-[0_40px_100px_rgba(15,23,42,0.3)] xl:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                    Live dashboard
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    Control Tower
                  </h2>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Operational
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Orders today", value: "2,847", delta: "+12%" },
                  { label: "On-time delivery", value: "98.4%", delta: "+2.1%" },
                  { label: "Active carriers", value: "24", delta: "All clear" },
                  { label: "Inventory health", value: "Optimal", delta: "0 alerts" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[1.4rem] bg-white/[0.07] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/40">{stat.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-emerald-400">{stat.delta}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-[1.4rem] bg-white/[0.07] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/40">Latest activity</p>
                <div className="mt-3 space-y-2.5">
                  {[
                    "Order #4821 dispatched → FastTrack Logistics",
                    "Low stock alert resolved → Warehouse B restocked",
                    "Carrier delay recovered → Route reassigned",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ca6b3f]" />
                      <p className="text-xs leading-5 text-white/55">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Metrics bar ── */}
        <section className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="glass-panel rounded-[1.8rem] p-5 sm:p-6">
                <Icon className="h-5 w-5 text-slate-400" />
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {m.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{m.label}</p>
              </div>
            );
          })}
        </section>

        {/* ── Features ── */}
        <section id="features" className="mt-10 scroll-mt-32">
          <div className="mb-8 text-center">
            <p className="section-kicker">Why teams choose this platform</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Built to solve real operations problems.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <article key={f.title} className="glass-panel rounded-[2rem] p-6 sm:p-8">
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ca6b3f]">
                        Solves: {f.problem}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                        {f.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{f.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Workflow ── */}
        <section id="workflow" className="mt-8 scroll-mt-32">
          <div className="glass-panel rounded-[2rem] p-8 sm:p-10">
            <div className="grid gap-10 xl:grid-cols-[1fr_1.4fr] xl:items-start">
              <div>
                <p className="section-kicker">How it works</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                  From first order to final delivery — fully automated.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Every step in the supply chain is tracked, validated, and audited automatically.
                  Your team focuses on strategy — the platform handles the operations.
                </p>
                <div className="mt-8">
                  <Link
                    href={showDashboardCta ? "/dashboard" : "/login"}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    See it live
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {WORKFLOW_STEPS.map((s) => (
                  <div key={s.step} className="data-tile flex items-start gap-5 rounded-[1.6rem] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-sm font-semibold text-white">
                      {s.step}
                    </div>
                    <div>
                      <p className="font-semibold tracking-tight text-slate-900">{s.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Access model ── */}
        <section id="access" className="mt-8 scroll-mt-32">
          <div className="mb-8 text-center">
            <p className="section-kicker">Access model</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              The right access for every person on your team.
            </h2>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            {ACCESS_MODEL.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.role} className="glass-panel rounded-[2rem] p-6 sm:p-8">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`mt-5 text-xs font-semibold uppercase tracking-[0.2em] ${item.accent}`}>
                    {item.tagline}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {item.role}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Tech stack ── */}
        <section id="stack" className="mt-8 scroll-mt-32">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Technology stack</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Enterprise-grade infrastructure. Zero compromises.
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {STACK_ITEMS.map((s) => (
                <div key={s.name} className="data-tile rounded-[1.4rem] p-4">
                  <p className="font-semibold tracking-tight text-slate-900">{s.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="mt-8">
          <div className="rounded-[2.2rem] bg-slate-950 p-10 text-center sm:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
              Ready to take control?
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Your operations deserve better than spreadsheets.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/55">
              Full order traceability, live inventory monitoring, and automated carrier recovery
              in a single platform your whole team can use from day one.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={showDashboardCta ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {showDashboardCta ? "Open control tower" : "Get started free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-4 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Explore features
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
