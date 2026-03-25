import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { organizations, products } from "@/lib/db/schema";
import type { AuthenticatedUser, Product } from "@/lib/supply-chain/types";
import type { CreateProductInput } from "@/lib/products/types";

class ProductError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isProductError(error: unknown): error is ProductError {
  return error instanceof ProductError;
}

function getScopedOrganizationId(viewer: AuthenticatedUser) {
  if (viewer.role !== "org_admin") return undefined;

  if (!viewer.organizationId) {
    throw new ProductError(
      "This org admin account has no organization assigned.",
      403,
      "org_assignment_missing"
    );
  }

  return viewer.organizationId;
}

function normalizeText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ProductError(`${label} is required.`);
  }
  return value.trim();
}

function mapProduct(row: {
  product: typeof products.$inferSelect;
  organization: typeof organizations.$inferSelect;
}): Product {
  return {
    id: row.product.id,
    organizationId: row.organization.id,
    organizationCode: row.organization.code,
    organizationName: row.organization.name,
    sku: row.product.sku,
    name: row.product.name,
    category: row.product.category,
    unitPrice: Number(row.product.unitPrice),
    reorderPoint: row.product.reorderPoint,
  };
}

/**
 * List products scoped by RBAC:
 * - owner / admin  → all products across all orgs
 * - org_admin      → only products belonging to their organization
 */
export async function listProducts(viewer: AuthenticatedUser): Promise<Product[]> {
  const db = getDb();
  const scopedOrgId = getScopedOrganizationId(viewer);

  const baseQuery = db
    .select({ product: products, organization: organizations })
    .from(products)
    .innerJoin(organizations, eq(products.organizationId, organizations.id));

  const rows = scopedOrgId
    ? await baseQuery
        .where(eq(products.organizationId, scopedOrgId))
        .orderBy(organizations.name, products.name)
    : await baseQuery.orderBy(organizations.name, products.name);

  return rows.map(mapProduct);
}

/**
 * Create a product with RBAC enforcement:
 * - owner / admin  → may specify any organizationId
 * - org_admin      → organizationId is always forced to their own org
 */
export async function createProduct(
  viewer: AuthenticatedUser,
  input: CreateProductInput
): Promise<Product> {
  const db = getDb();
  const scopedOrgId = getScopedOrganizationId(viewer);

  // RBAC: org_admin cannot cross org boundary
  if (scopedOrgId && input.organizationId !== scopedOrgId) {
    throw new ProductError(
      "You can only create products for your own organization.",
      403,
      "forbidden"
    );
  }

  const organizationId = scopedOrgId ?? input.organizationId;

  if (!organizationId) {
    throw new ProductError(
      "Select an organization for this product.",
      400,
      "missing_organization"
    );
  }

  const sku = normalizeText(input.sku, "SKU").toUpperCase();
  const name = normalizeText(input.name, "Product name");
  const category = normalizeText(input.category, "Category");
  const unitPrice = Number(input.unitPrice);
  const reorderPoint = Number(input.reorderPoint);

  if (Number.isNaN(unitPrice) || unitPrice < 0) {
    throw new ProductError("Unit price must be a valid positive number.", 400, "invalid_price");
  }

  if (!Number.isInteger(reorderPoint) || reorderPoint < 0) {
    throw new ProductError(
      "Reorder point must be a non-negative integer.",
      400,
      "invalid_reorder_point"
    );
  }

  return db.transaction(async (tx) => {
    const [organization] = await tx
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      throw new ProductError("Organization not found.", 404, "org_not_found");
    }

    const [existing] = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    if (existing) {
      throw new ProductError(
        "A product with this SKU already exists.",
        409,
        "sku_taken"
      );
    }

    const now = new Date();
    const [product] = await tx
      .insert(products)
      .values({
        organizationId,
        sku,
        name,
        category,
        unitPrice: unitPrice.toFixed(2),
        reorderPoint,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return mapProduct({ product, organization });
  });
}

/**
 * List categories derived from existing products in scope.
 * Used to populate the category dropdown.
 */
export async function listProductCategories(viewer: AuthenticatedUser): Promise<string[]> {
  const all = await listProducts(viewer);
  const categories = [...new Set(all.map((p) => p.category))].sort();
  return categories;
}
