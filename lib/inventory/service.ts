import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { products, warehouseInventory, warehouses } from "@/lib/db/schema";
import type { AuthenticatedUser } from "@/lib/supply-chain/types";
import type { AdjustInventoryInput, InventoryRow } from "@/lib/inventory/types";
export { listWarehouses } from "@/lib/warehouses/service";

class InventoryError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isInventoryError(error: unknown): error is InventoryError {
  return error instanceof InventoryError;
}

function getScopedOrganizationId(viewer: AuthenticatedUser) {
  if (viewer.role !== "org_admin") return undefined;

  if (!viewer.organizationId) {
    throw new InventoryError(
      "This org admin account has no organization assigned.",
      403,
      "org_assignment_missing"
    );
  }

  return viewer.organizationId;
}

/**
 * List all warehouse_inventory rows visible to the viewer.
 * - owner / admin  → all rows
 * - org_admin      → only rows for their org's products
 */
export async function listInventoryRows(viewer: AuthenticatedUser): Promise<InventoryRow[]> {
  const db = getDb();
  const scopedOrgId = getScopedOrganizationId(viewer);

  const baseQuery = db
    .select({
      inv: warehouseInventory,
      product: products,
      warehouse: warehouses,
    })
    .from(warehouseInventory)
    .innerJoin(products, eq(warehouseInventory.productId, products.id))
    .innerJoin(warehouses, eq(warehouseInventory.warehouseId, warehouses.id));

  const rows = scopedOrgId
    ? await baseQuery.where(eq(products.organizationId, scopedOrgId))
    : await baseQuery;

  return rows.map((row) => ({
    id: row.inv.id,
    productId: row.product.id,
    productSku: row.product.sku,
    productName: row.product.name,
    warehouseId: row.warehouse.id,
    warehouseName: row.warehouse.name,
    availableUnits: row.inv.availableUnits,
    reservedUnits: row.inv.reservedUnits,
    safetyStock: row.inv.safetyStock,
  }));
}

/**
 * Upsert warehouse inventory stock for a product.
 * RBAC:
 * - owner / admin  → may adjust any product's inventory
 * - org_admin      → may only adjust their org's products
 */
export async function adjustInventoryStock(
  viewer: AuthenticatedUser,
  input: AdjustInventoryInput
): Promise<void> {
  const db = getDb();
  const scopedOrgId = getScopedOrganizationId(viewer);

  const availableUnits = Number(input.availableUnits);
  const safetyStock = Number(input.safetyStock);

  if (!Number.isInteger(availableUnits) || availableUnits < 0) {
    throw new InventoryError(
      "Available units must be a non-negative integer.",
      400,
      "invalid_units"
    );
  }

  if (!Number.isInteger(safetyStock) || safetyStock < 0) {
    throw new InventoryError(
      "Safety stock must be a non-negative integer.",
      400,
      "invalid_safety_stock"
    );
  }

  // RBAC: verify org_admin only touches their org's products
  if (scopedOrgId) {
    const [product] = await db
      .select({ organizationId: products.organizationId })
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1);

    if (!product) {
      throw new InventoryError("Product not found.", 404, "product_not_found");
    }

    if (product.organizationId !== scopedOrgId) {
      throw new InventoryError(
        "You can only adjust inventory for your own organization's products.",
        403,
        "forbidden"
      );
    }
  }

  const now = new Date();

  const [existing] = await db
    .select({ id: warehouseInventory.id })
    .from(warehouseInventory)
    .where(
      and(
        eq(warehouseInventory.warehouseId, input.warehouseId),
        eq(warehouseInventory.productId, input.productId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(warehouseInventory)
      .set({ availableUnits, safetyStock, updatedAt: now })
      .where(eq(warehouseInventory.id, existing.id));
  } else {
    await db.insert(warehouseInventory).values({
      warehouseId: input.warehouseId,
      productId: input.productId,
      availableUnits,
      reservedUnits: 0,
      safetyStock,
      createdAt: now,
      updatedAt: now,
    });
  }
}
