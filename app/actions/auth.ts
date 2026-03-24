"use server";

import { redirect } from "next/navigation";
import { logoutCurrentSession } from "@/lib/auth/service";

export async function logoutAction() {
  await logoutCurrentSession();
  redirect("/");
}
