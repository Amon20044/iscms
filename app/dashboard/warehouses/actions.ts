"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardUser } from "@/lib/auth/service";
import { createWarehouse, isWarehouseError } from "@/lib/warehouses/service";
import type { WarehouseFormState } from "@/lib/warehouses/types";

export async function createWarehouseAction(
  _state: WarehouseFormState,
  formData: FormData
): Promise<WarehouseFormState> {
  const viewer = await requireDashboardUser();

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const handlingHours = Number(formData.get("handlingHours"));
  const capacityScore = Number(formData.get("capacityScore"));

  try {
    const warehouse = await createWarehouse(viewer, {
      code,
      name,
      city,
      region,
      handlingHours,
      capacityScore,
    });

    revalidatePath("/dashboard/warehouses");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");

    return { success: `Warehouse "${warehouse.name}" (${warehouse.code}) registered successfully.` };
  } catch (error) {
    if (isWarehouseError(error)) {
      return { error: error.message };
    }
    return { error: "Unable to create warehouse. Please try again." };
  }
}
