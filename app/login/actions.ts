"use server";

import { redirect } from "next/navigation";
import { createLoginSession, isDashboardRole, writeSessionCookie } from "@/lib/auth/service";

export type LoginFormState =
  | {
      error?: string;
    }
  | undefined;

export async function loginAction(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const result = await createLoginSession(email, password);
    await writeSessionCookie(result.token, result.expiresAt);

    if (isDashboardRole(result.user.role)) {
      redirect("/dashboard");
    }

    redirect("/");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to sign in.",
    };
  }
}
