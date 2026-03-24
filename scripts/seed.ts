import "dotenv/config";
import { desc } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db/client";
import {
  appUserProfiles,
  authAccounts,
  authSessions,
  automationRuns,
  carriers,
  orders,
  organizations,
  products,
  warehouseInventory,
  warehouses,
  workflowLogs,
} from "@/lib/db/schema";
import {
  seedAuthAccounts,
  seedAutomationRuns,
  seedCarriers,
  seedInventory,
  seedLogs,
  seedOrders,
  seedOrganizations,
  seedProducts,
  seedUserProfiles,
  seedWarehouses,
} from "@/lib/supply-chain/seed-data";

function offsetIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function main() {
  const db = getDb();

  await db.delete(authSessions);
  await db.delete(authAccounts);
  await db.delete(workflowLogs);
  await db.delete(automationRuns);
  await db.delete(orders);
  await db.delete(warehouseInventory);
  await db.delete(carriers);
  await db.delete(warehouses);
  await db.delete(products);
  await db.delete(appUserProfiles);
  await db.delete(organizations);

  await db.insert(organizations).values(
    seedOrganizations.map((organization) => ({
      ...organization,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  const organizationIdByCode = new Map(
    seedOrganizations.map((organization) => [organization.code, organization.id])
  );

  await db.insert(appUserProfiles).values(
    seedUserProfiles.map((profile) => ({
      id: profile.id,
      authUserId: profile.authUserId,
      organizationId: profile.organizationCode
        ? organizationIdByCode.get(profile.organizationCode)!
        : null,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  await db.insert(authAccounts).values(
    seedAuthAccounts.map((account) => ({
      ...account,
      passwordHash: hashPassword(account.password),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  await db.insert(products).values(
    seedProducts.map((product) => ({
      id: product.id,
      organizationId: organizationIdByCode.get(product.organizationCode)!,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unitPrice: product.unitPrice,
      reorderPoint: product.reorderPoint,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  await db.insert(warehouses).values(
    seedWarehouses.map((warehouse) => ({
      ...warehouse,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  await db.insert(carriers).values(
    seedCarriers.map((carrier) => ({
      ...carrier,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  const productIdBySku = new Map(seedProducts.map((product) => [product.sku, product.id]));
  const warehouseIdByCode = new Map(
    seedWarehouses.map((warehouse) => [warehouse.code, warehouse.id])
  );
  const carrierIdByCode = new Map(seedCarriers.map((carrier) => [carrier.code, carrier.id]));
  const orderIdByNumber = new Map(seedOrders.map((order) => [order.orderNumber, order.id]));

  await db.insert(warehouseInventory).values(
    seedInventory.map((record) => ({
      id: record.id,
      warehouseId: warehouseIdByCode.get(record.warehouseCode)!,
      productId: productIdBySku.get(record.sku)!,
      availableUnits: record.availableUnits,
      reservedUnits: record.reservedUnits,
      safetyStock: record.safetyStock,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  await db.insert(orders).values(
    seedOrders.map((order) => ({
      id: order.id,
      organizationId: organizationIdByCode.get(order.organizationCode)!,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      actorRole: order.actorRole,
      productId: productIdBySku.get(order.productSku)!,
      quantity: order.quantity,
      priority: order.priority,
      deliveryLocation: order.deliveryLocation,
      region: order.region,
      requestedDeliveryAt: offsetIso(order.requestedOffsetHours),
      expectedDeliveryAt: offsetIso(order.expectedOffsetHours),
      currentState: order.state,
      assignedWarehouseId: warehouseIdByCode.get(order.warehouseCode)!,
      assignedCarrierId: carrierIdByCode.get(order.carrierCode)!,
      trackingCode: order.trackingCode,
      delayReason: order.delayReason,
      reassignmentCount: order.reassignmentCount,
      createdAt: offsetIso(order.createdOffsetHours),
      lastCheckedAt: new Date(),
      lastUpdatedAt: new Date(),
      transitStartedAt:
        order.transitOffsetHours === null
          ? null
          : offsetIso(order.transitOffsetHours),
      deliveredAt:
        order.deliveredOffsetHours === null
          ? null
          : offsetIso(order.deliveredOffsetHours),
    }))
  );

  await db.insert(workflowLogs).values(
    seedLogs.map((log) => ({
      id: log.id,
      orderId: orderIdByNumber.get(log.orderNumber)!,
      actor: log.actor,
      action: log.action,
      summary: log.summary,
      fromState: log.fromState,
      toState: log.toState,
      createdAt: offsetIso(log.offsetHours),
    }))
  );

  await db.insert(automationRuns).values(
    seedAutomationRuns.map((run, index) => ({
      id: run.id,
      organizationId: run.organizationCode
        ? organizationIdByCode.get(run.organizationCode)!
        : null,
      summary: run.summary.join("\n"),
      actionsCount: run.summary.length,
      createdAt: offsetIso(-index),
    }))
  );

  const [latestRun] = await db
    .select()
    .from(automationRuns)
    .orderBy(desc(automationRuns.createdAt))
    .limit(1);

  console.log(
    JSON.stringify(
      {
        ok: true,
        seededOrders: seedOrders.length,
        seededOrganizations: seedOrganizations.length,
        latestAutomationRun: latestRun?.createdAt ?? null,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
