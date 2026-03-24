import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Database,
  Network,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Warehouse,
  Workflow,
} from "lucide-react";
import { getCurrentUser, isDashboardRole } from "@/lib/auth/service";
import { USER_ROLE_LABELS } from "@/lib/supply-chain/types";

const PLATFORM_PILLARS = [
  {
    icon: Boxes,
    title: "Order orchestration",
    description:
      "Accept requests, validate inventory, assign warehouses, and dispatch the right carrier lane in one controlled flow.",
  },
  {
    icon: Warehouse,
    title: "Inventory intelligence",
    description:
      "Watch stock pressure, reserved units, and primary hubs before shortages become operational failures.",
  },
  {
    icon: Truck,
    title: "Carrier recovery",
    description:
      "Track ETA drift, flag delays, and reassign logistics automatically when SLA risk is detected.",
  },
  {
    icon: Workflow,
    title: "Workflow traceability",
    description:
      "Expose the lifecycle from created to delivered with audit logs, reassignment history, and automation summaries.",
  },
] as const;

const WORKFLOW_STEPS = [
  "Order received through the operations layer",
  "Inventory availability validated against live warehouse stock",
  "Warehouse and carrier assigned based on region and capacity",
  "Automation loop checks drift, delay flags, and recovery options",
  "Control tower updates traceability and final delivery state",
] as const;

const ACCESS_MODEL = [
  {
    icon: ShieldCheck,
    title: "Owner",
    description:
      "Controls platform access, provisions admins, and sees the full control tower navigation including team access.",
  },
  {
    icon: Users,
    title: "Org Admin",
    description:
      "Operates the control tower across orders, inventory, and automation without owner-only team provisioning.",
  },
  {
    icon: Network,
    title: "Admin",
    description:
      "Executes day-to-day routing, reassignment, and delivery operations inside the secured dashboard.",
  },
] as const;

const STACK = [
  {
    icon: Database,
    title: "Neon Postgres 17",
    description:
      "Structured operations data, session storage, and seeded owner access live in the same backend platform.",
  },
  {
    icon: Boxes,
    title: "Drizzle ORM",
    description:
      "Typed schema, migrations, and RBAC-friendly data access keep the backend maintainable and explicit.",
  },
  {
    icon: Workflow,
    title: "Next.js 16",
    description:
      "Landing, login, dashboard, and role-aware navigation are all handled in one app-router product surface.",
  },
] as const;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const viewer = await getCurrentUser();
  const showDashboardCta = viewer && isDashboardRole(viewer.role);

  return (
    <main className="relative z-10 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="glass-panel overflow-hidden rounded-[2.8rem] p-7 sm:p-10">
          <div className="grid gap-10 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div>
              <p className="section-kicker">Inventory and Supply Chain Management System</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-6xl">
                A control tower product for inventory, logistics, delay recovery, and role-based operations.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                This product turns your SRS into a polished platform: public landing experience, secured login,
                personalized navigation, and a domain-native dashboard for running supply chain workflows in real time.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2">Project: srs</span>
                <span className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2">Author: Avni Singhal</span>
                <span className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2">Neon + Drizzle + RBAC</span>
                {viewer ? (
                  <span className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2">
                    Signed in as {USER_ROLE_LABELS[viewer.role]}
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  href={showDashboardCta ? "/dashboard" : "/login"}
                >
                  {showDashboardCta ? "Open control tower" : "Login to dashboard"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-900/18 hover:bg-white"
                  href="#workflow"
                >
                  Explore workflow
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2.2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                      Platform snapshot
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                      Supply chain from intake to delivery
                    </h2>
                  </div>
                  <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    Role aware
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60">Public layer</p>
                    <p className="mt-2 text-lg font-semibold">Landing page with product narrative</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60">Secure layer</p>
                    <p className="mt-2 text-lg font-semibold">Owner and admin login with RBAC navigation</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60">Operations layer</p>
                    <p className="mt-2 text-lg font-semibold">Orders, inventory, automation, and traceability</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60">Owner layer</p>
                    <p className="mt-2 text-lg font-semibold">Provision org admins and overall admins</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="mt-8 scroll-mt-32">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PLATFORM_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className="glass-panel rounded-[2rem] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                    {pillar.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {pillar.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr] scroll-mt-32">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Navigation mirrors the real operational journey.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Public users understand the platform through product sections. Logged-in operations users jump directly into
              Control Tower, Orders, Inventory, and Automation. Owners get one extra navigation path for team access.
            </p>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="space-y-4">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step} className="data-tile flex items-start gap-4 rounded-[1.6rem] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-7 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="access" className="mt-8 grid gap-6 xl:grid-cols-3 scroll-mt-32">
          {ACCESS_MODEL.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="glass-panel rounded-[2rem] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[#ca6b3f]" />
                  <p className="section-kicker">Access Model</p>
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                  {item.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </section>

        <section id="stack" className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr] scroll-mt-32">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Technology Stack</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Built for typed backend control and polished frontend delivery.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {STACK.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="data-tile rounded-[1.6rem] p-5">
                    <Icon className="h-5 w-5 text-slate-900" />
                    <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-kicker">Outcome</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              The UX now has a proper product front door.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Instead of dropping everyone into one generic page, the experience now separates discovery, secure access,
              and role-aware operations. That makes the navigation meaningful for the domain and clearer for evaluators,
              admins, and owners.
            </p>
            <div className="mt-6 rounded-[1.8rem] border border-slate-900/10 bg-slate-950 px-5 py-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Current handoff</p>
              <p className="mt-3 text-lg font-semibold">
                {showDashboardCta
                  ? `You are signed in as ${USER_ROLE_LABELS[viewer.role]}. Continue into the control tower.`
                  : "Login to enter the secured control tower and role-aware dashboard."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
