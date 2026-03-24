"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AutomationConsoleProps = {
  lastRunAt: string;
  summary: string[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AutomationConsole({ lastRunAt, summary }: AutomationConsoleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(summary);
  const [lastRun, setLastRun] = useState(lastRunAt);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setError(null);

    const response = await fetch("/api/automation/run", {
      method: "POST",
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Automation cycle failed.");
      return;
    }

    setItems(payload.summary);
    setLastRun(payload.ranAt);
    startTransition(() => router.refresh());
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <p className="section-kicker">Automation Engine</p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Delay detection and recovery loop
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            This cycle checks ETA drift, carrier health, reassignment candidates,
            and delivery completion against the Neon-backed order graph.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full bg-[#ca6b3f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b95d34] disabled:cursor-not-allowed disabled:bg-[#d9a48c]"
          disabled={isPending}
          onClick={handleRun}
          type="button"
        >
          {isPending ? "Running cycle..." : "Run automation cycle"}
        </button>
      </div>

      <div className="mt-8 rounded-[1.6rem] border border-slate-900/10 bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Last execution
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatDateTime(lastRun)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded-full border border-slate-900/10 bg-slate-100 px-3 py-2">
              Postgres 17
            </span>
            <span className="rounded-full border border-slate-900/10 bg-slate-100 px-3 py-2">
              AWS Singapore
            </span>
            <span className="rounded-full border border-slate-900/10 bg-slate-100 px-3 py-2">
              Neon Auth ready
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-900/8 bg-[#fffaf2] px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-900/8 bg-slate-950 px-4 py-4 text-sm text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">Schema</p>
            <p className="mt-2 font-semibold">Drizzle migrations + typed relations</p>
          </div>
          <div className="rounded-2xl border border-slate-900/8 bg-[#184d49] px-4 py-4 text-sm text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">Runtime</p>
            <p className="mt-2 font-semibold">Next 16 route handlers on Node runtime</p>
          </div>
          <div className="rounded-2xl border border-slate-900/8 bg-[#7c4e2a] px-4 py-4 text-sm text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">Profiles</p>
            <p className="mt-2 font-semibold">App user roles are ready for Neon Auth IDs</p>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-[#8f3e31]">{error}</p> : null}
      </div>
    </section>
  );
}
