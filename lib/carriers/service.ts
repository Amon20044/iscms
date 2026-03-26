import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { carriers } from "@/lib/db/schema";
import type { AuthenticatedUser, Carrier, Region } from "@/lib/supply-chain/types";
import type { CreateCarrierInput, SetCarrierStatusInput } from "@/lib/carriers/types";

const VALID_REGIONS = ["north", "west", "south", "east", "central"] as const;
const VALID_STATUSES = ["active", "degraded", "offline"] as const;

type CarrierStatus = (typeof VALID_STATUSES)[number];

class CarrierError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isCarrierError(error: unknown): error is CarrierError {
  return error instanceof CarrierError;
}

function requireOwner(viewer: AuthenticatedUser) {
  if (viewer.role !== "owner") {
    throw new CarrierError(
      "Only the platform owner can manage carriers.",
      403,
      "forbidden"
    );
  }
}

function normalizeText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new CarrierError(`${label} is required.`);
  }
  return value.trim();
}

function mapCarrier(c: typeof carriers.$inferSelect): Carrier {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    status: c.status,
    averageEtaHours: c.averageEtaHours,
    reliabilityScore: c.reliabilityScore,
    supportedRegions: c.supportedRegions as Region[],
    delayBiasHours: c.delayBiasHours,
  };
}

export async function listCarriers(): Promise<Carrier[]> {
  const db = getDb();
  const rows = await db.select().from(carriers).orderBy(asc(carriers.name));
  return rows.map(mapCarrier);
}

export async function createCarrier(
  viewer: AuthenticatedUser,
  input: CreateCarrierInput
): Promise<Carrier> {
  requireOwner(viewer);
  const db = getDb();

  const code = normalizeText(input.code, "Code").toUpperCase();
  const name = normalizeText(input.name, "Name");
  const status = input.status as CarrierStatus;
  const averageEtaHours = Number(input.averageEtaHours);
  const reliabilityScore = Number(input.reliabilityScore);
  const delayBiasHours = Number(input.delayBiasHours);
  const supportedRegions = Array.isArray(input.supportedRegions)
    ? input.supportedRegions
    : [];

  if (!VALID_STATUSES.includes(status)) {
    throw new CarrierError("Select a valid status.", 400, "invalid_status");
  }

  if (!Number.isInteger(averageEtaHours) || averageEtaHours < 1) {
    throw new CarrierError(
      "Average ETA hours must be a positive integer.",
      400,
      "invalid_eta"
    );
  }

  if (
    !Number.isInteger(reliabilityScore) ||
    reliabilityScore < 1 ||
    reliabilityScore > 100
  ) {
    throw new CarrierError(
      "Reliability score must be between 1 and 100.",
      400,
      "invalid_reliability"
    );
  }

  if (!Number.isInteger(delayBiasHours) || delayBiasHours < 0) {
    throw new CarrierError(
      "Delay bias hours must be a non-negative integer.",
      400,
      "invalid_delay_bias"
    );
  }

  const invalidRegion = supportedRegions.find(
    (r) => !VALID_REGIONS.includes(r as (typeof VALID_REGIONS)[number])
  );
  if (invalidRegion) {
    throw new CarrierError(
      `"${invalidRegion}" is not a valid region.`,
      400,
      "invalid_region"
    );
  }

  if (supportedRegions.length === 0) {
    throw new CarrierError(
      "Select at least one supported region.",
      400,
      "no_regions"
    );
  }

  const [existing] = await db
    .select({ id: carriers.id })
    .from(carriers)
    .where(eq(carriers.code, code))
    .limit(1);

  if (existing) {
    throw new CarrierError(
      "A carrier with this code already exists.",
      409,
      "code_taken"
    );
  }

  const now = new Date();
  const [row] = await db
    .insert(carriers)
    .values({
      code,
      name,
      status,
      averageEtaHours,
      reliabilityScore,
      delayBiasHours,
      supportedRegions,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapCarrier(row);
}

export async function setCarrierStatus(
  viewer: AuthenticatedUser,
  input: SetCarrierStatusInput
): Promise<Carrier> {
  requireOwner(viewer);
  const db = getDb();

  const status = input.status as CarrierStatus;

  if (!VALID_STATUSES.includes(status)) {
    throw new CarrierError("Select a valid status.", 400, "invalid_status");
  }

  const [existing] = await db
    .select()
    .from(carriers)
    .where(eq(carriers.id, input.carrierId))
    .limit(1);

  if (!existing) {
    throw new CarrierError("Carrier not found.", 404, "not_found");
  }

  const [row] = await db
    .update(carriers)
    .set({ status, updatedAt: new Date() })
    .where(eq(carriers.id, input.carrierId))
    .returning();

  return mapCarrier(row);
}
