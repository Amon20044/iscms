import { Boxes, ShieldCheck, UserCog } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, isDashboardRole } from "@/lib/auth/service";
import { USER_ROLE_LABELS } from "@/lib/supply-chain/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ACCESS_NOTES = [
  {
    icon: ShieldCheck,
    title: "Owner secured",
    description:
      "Owner login unlocks the team access route and admin provisioning workflow.",
  },
  {
    icon: UserCog,
    title: "Role aware",
    description:
      "The navbar and dashboard surface change automatically for owner, org admin, and admin users.",
  },
  {
    icon: Boxes,
    title: "Operations ready",
    description:
      "Orders, inventory, automation, and traceability are available immediately after sign in.",
  },
] as const;

export default async function LoginPage() {
  const viewer = await getCurrentUser();

  if (viewer && isDashboardRole(viewer.role)) {
    redirect("/dashboard");
  }

  return (
    <main className="relative z-10 pb-16">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-10">
        <section className="glass-panel rounded-[2.2rem] p-7 sm:p-9">
          <p className="section-kicker">Access Portal</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-slate-900">
            Login for internal supply-chain operations.
          </h1>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Use the seeded owner credentials to enter the RBAC-enabled control
            tower. Once inside, the navigation changes to reflect domain tasks
            instead of generic application sections.
          </p>

          <div className="mt-6 space-y-4">
            {ACCESS_NOTES.map((note) => {
              const Icon = note.icon;
              return (
                <article key={note.title} className="data-tile rounded-[1.6rem] p-5">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-slate-900" />
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      {note.title}
                    </h2>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {note.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
