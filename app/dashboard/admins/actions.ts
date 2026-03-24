"use server";

import { revalidatePath } from "next/cache";
import { createInternalAccessUser, requireOwnerUser } from "@/lib/auth/service";
import { type UserRole } from "@/lib/supply-chain/types";

export type CreateAdminFormState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

export async function createAdminAction(
  _state: CreateAdminFormState,
  formData: FormData
): Promise<CreateAdminFormState> {
  await requireOwnerUser();

  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  try {
    const createdUser = await createInternalAccessUser({
      email,
      name,
      password,
      role,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admins");

    return {
      success: `${createdUser.name} was created as ${createdUser.role.replaceAll("_", " ")}.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create admin access.",
    };
  }
}
