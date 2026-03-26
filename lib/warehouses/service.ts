import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { warehouses } from "@/lib/db/schema";
import type { AuthenticatedUser, Warehouse } from "@/lib/supply-chain/types";
import type { CreateWarehouseInput } from "@/lib/warehouses/types";

const VALID_REGIONS = ["north", "west", "south", "east", "central"] as const;

class WarehouseError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isWarehouseError(error: unknown): error is WarehouseError {
  return error instanceof WarehouseError;
}

function requireOwner(viewer: AuthenticatedUser) {
  if (viewer.role !== "owner") {
    throw new WarehouseError(
      "Only the platform owner can manage warehouses.",
      403,
      "forbidden"
    );
  }
}

function normalizeText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new WarehouseError(`${label} is required.`);
  }
  return value.trim();
}

function mapWarehouse(w: typeof warehouses.$inferSelect): Warehouse {
  return {
    id: w.id,
    code: w.code,
    name: w.name,
    city: w.city,
    region: w.region,
    handlingHours: w.handlingHours,
    capacityScore: w.capacityScore,
  };
}

export async function listWarehouses(): Promise<Warehouse[]> {
  const db = getDb();
  const rows = await db.select().from(warehouses).orderBy(asc(warehouses.name));
  return rows.map(mapWarehouse);
}

export async function createWarehouse(
  viewer: AuthenticatedUser,
  input: CreateWarehouseInput
): Promise<Warehouse> {
  requireOwner(viewer);
  const db = getDb();

  const code = normalizeText(input.code, "Code").toUpperCase();
  const name = normalizeText(input.name, "Name");
  const city = normalizeText(input.city, "City");
  const region = input.region;
  const handlingHours = Number(input.handlingHours);
  const capacityScore = Number(input.capacityScore);

  if (!VALID_REGIONS.includes(region as (typeof VALID_REGIONS)[number])) {
    throw new WarehouseError("Select a valid region.", 400, "invalid_region");
  }

  if (!Number.isInteger(handlingHours) || handlingHours < 0) {
    throw new WarehouseError(
      "Handling hours must be a non-negative integer.",
      400,
      "invalid_hours"
    );
  }

  if (
    !Number.isInteger(capacityScore) ||
    capacityScore < 1 ||
    capacityScore > 100
  ) {
    throw new WarehouseError(
      "Capacity score must be between 1 and 100.",
      400,
      "invalid_capacity"
    );
  }

  const [existing] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(eq(warehouses.code, code))
    .limit(1);

  if (existing) {
    throw new WarehouseError(
      "A warehouse with this code already exists.",
      409,
      "code_taken"
    );
  }

  const now = new Date();
  const [row] = await db
    .insert(warehouses)
    .values({
      code,
      name,
      city,
      region: region as (typeof VALID_REGIONS)[number],
      handlingHours,
      capacityScore,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapWarehouse(row);
}
