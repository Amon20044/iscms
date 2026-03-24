"use server";

import { revalidatePath } from "next/cache";
import {
  createInternalAccessUser,
  createOrganization,
  requireOwnerUser,
} from "@/lib/auth/service";
import { type UserRole } from "@/lib/supply-chain/types";

export type CreateAdminFormState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

export type CreateOrganizationFormState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

export async function createOrganizationAction(
  _state: CreateOrganizationFormState,
  formData: FormData
): Promise<CreateOrganizationFormState> {
  await requireOwnerUser();

  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "");

  try {
    const organization = await createOrganization({ code, name });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admins");

    return {
      success: `${organization.name} (${organization.code}) is now available for org-admin assignment.`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create organization.",
    };
  }
}

export async function createAdminAction(
  _state: CreateAdminFormState,
  formData: FormData
): Promise<CreateAdminFormState> {
  await requireOwnerUser();

  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const organizationId = String(formData.get("organizationId") ?? "").trim();

  try {
    const createdUser = await createInternalAccessUser({
      email,
      name,
      password,
      role,
      organizationId: organizationId || undefined,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admins");

    return {
      success: createdUser.organizationName
        ? `${createdUser.name} was created as ${createdUser.role.replaceAll("_", " ")} for ${createdUser.organizationName}.`
        : `${createdUser.name} was created as ${createdUser.role.replaceAll("_", " ")}.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create admin access.",
    };
  }
}
