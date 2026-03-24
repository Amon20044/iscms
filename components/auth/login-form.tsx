"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { loginAction, type LoginFormState } from "@/app/login/actions";

const initialState: LoginFormState = undefined;

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="glass-panel rounded-[2.2rem] p-7 sm:p-9">
      <p className="section-kicker">Secure Sign In</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        Enter the operations workspace.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
        Owner, org admin, and admin access is routed through Neon-backed
        sessions so the control tower navigation and actions reflect real RBAC.
      </p>

      <div className="mt-8 grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Email
          </span>
          <div className="input-surface flex items-center gap-3 rounded-2xl px-4 py-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              className="w-full bg-transparent text-sm text-slate-800 outline-none"
              name="email"
              placeholder="you@company.com"
              type="email"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Password
          </span>
          <div className="input-surface flex items-center gap-3 rounded-2xl px-4 py-3">
            <KeyRound className="h-4 w-4 text-slate-500" />
            <input
              className="w-full bg-transparent text-sm text-slate-800 outline-none"
              name="password"
              placeholder="Enter password"
              type={showPassword ? "text" : "password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
      </div>

      {state?.error ? (
        <div className="mt-5 rounded-2xl border border-[#cb5e4a]/18 bg-[#fff0eb] px-4 py-3 text-sm text-[#8f3e31]">
          {state.error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Seeded owner account is ready for the first login.
        </p>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={pending}
          type="submit"
        >
          {pending ? "Signing in..." : "Login to dashboard"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
