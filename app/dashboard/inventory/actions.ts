"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardUser } from "@/lib/auth/service";
import { createProduct, isProductError } from "@/lib/products/service";
import { adjustInventoryStock, isInventoryError } from "@/lib/inventory/service";
import type { CreateProductFormState } from "@/lib/products/types";
import type { AdjustInventoryFormState } from "@/lib/inventory/types";


export async function createProductAction(
  _state: CreateProductFormState,
  formData: FormData
): Promise<CreateProductFormState> {
  const viewer = await requireDashboardUser();

  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const unitPrice = Number(formData.get("unitPrice"));
  const reorderPoint = Number(formData.get("reorderPoint"));

  try {
    const product = await createProduct(viewer, {
      organizationId,
      sku,
      name,
      category,
      unitPrice,
      reorderPoint,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");

    return {
      success: `Product "${product.name}" (${product.sku}) created for ${product.organizationName}.`,
    };
  } catch (error) {
    if (isProductError(error)) {
      return { error: error.message };
    }
    return { error: "Unable to create product. Please try again." };
  }
}

export async function adjustInventoryAction(
  _state: AdjustInventoryFormState,
  formData: FormData
): Promise<AdjustInventoryFormState> {
  const viewer = await requireDashboardUser();

  const productId = String(formData.get("productId") ?? "").trim();
  const warehouseId = String(formData.get("warehouseId") ?? "").trim();
  const availableUnits = Number(formData.get("availableUnits"));
  const safetyStock = Number(formData.get("safetyStock"));

  try {
    await adjustInventoryStock(viewer, {
      productId,
      warehouseId,
      availableUnits,
      safetyStock,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");

    return { success: "Inventory updated successfully." };
  } catch (error) {
    if (isInventoryError(error)) {
      return { error: error.message };
    }
    return { error: "Unable to update inventory. Please try again." };
  }
}
