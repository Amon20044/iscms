
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
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
  ORDER_STATE_DESCRIPTIONS,
  ORDER_STATE_SEQUENCE,
  type AuthenticatedUser,
  type Carrier,
  type CarrierSignal,
  type CreateOrderInput,
  type DashboardSnapshot,
  type DelayAlert,
  type InventorySignal,
  type Order,
  type OrderMutationInput,
  type OrderState,
  type Organization,
  type Priority,
  type Product,
  type Region,
  type StoreMeta,
  type UserRole,
  type WarehouseSignal,
  type WorkflowLog,
  type WorkflowStat,
} from "@/lib/supply-chain/types";

class SupplyChainError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isSupplyChainError(error: unknown): error is SupplyChainError {
  return error instanceof SupplyChainError;
}

type InventoryBundle = {
  inventory: typeof warehouseInventory.$inferSelect;
  product: typeof products.$inferSelect;
  organization: typeof organizations.$inferSelect;
  warehouse: typeof warehouses.$inferSelect;
};

type OrderBundle = {
  order: typeof orders.$inferSelect;
  organization: typeof organizations.$inferSelect;
  product: typeof products.$inferSelect;
  warehouse: typeof warehouses.$inferSelect | null;
  carrier: typeof carriers.$inferSelect | null;
};

type ProductBundle = {
  product: typeof products.$inferSelect;
  organization: typeof organizations.$inferSelect;
};

type LogBundle = {
  log: typeof workflowLogs.$inferSelect;
  orderNumber: string;
};

type DbClient = ReturnType<typeof getDb>;
type DbTransaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
type DbExecutor = DbClient | DbTransaction;

function getScopedOrganizationId(viewer: AuthenticatedUser) {
  if (viewer.role !== "org_admin") {
    return undefined;
  }

  if (!viewer.organizationId) {
    throw new SupplyChainError(
      "This org admin account is missing an organization assignment.",
      403,
      "org_assignment_missing"
    );
  }

  return viewer.organizationId;
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return toDate(value).toISOString();
}

function differenceInHours(later: Date | string, earlier: Date | string) {
  return (toDate(later).getTime() - toDate(earlier).getTime()) / 3_600_000;
}

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 3_600_000);
}

function calculateExpectedDeliveryAt(
  now: Date,
  handlingHours: number,
  carrierEtaHours: number,
  priority: Priority
) {
  const multiplier =
    priority === "critical" ? 0.68 : priority === "express" ? 0.82 : 1;
  const totalHours = (handlingHours + carrierEtaHours) * multiplier;
  return addHours(now, totalHours);
}

function createOrderNumber() {
  return `SRS-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function createTrackingCode() {
  return `TRK-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function normalizeText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new SupplyChainError(`${label} is required.`);
  }

  return value.trim();
}

function normalizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string
) {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new SupplyChainError(`${label} is invalid.`);
  }

  return value as T;
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new SupplyChainError("Quantity must be a positive integer.");
  }

  return quantity;
}

function normalizeFutureDate(value: unknown) {
  const text = normalizeText(value, "Requested delivery time");
  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new SupplyChainError("Requested delivery time must be a valid date.");
  }

  if (date.getTime() <= Date.now()) {
    throw new SupplyChainError(
      "Requested delivery time must be in the future."
    );
  }

  return date;
}

function mapOrganization(row: typeof organizations.$inferSelect): Organization {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
  };
}

function mapProduct(bundle: ProductBundle): Product {
  return {
    id: bundle.product.id,
    organizationId: bundle.organization.id,
    organizationCode: bundle.organization.code,
    organizationName: bundle.organization.name,
    sku: bundle.product.sku,
    name: bundle.product.name,
    category: bundle.product.category,
    unitPrice: Number(bundle.product.unitPrice),
    reorderPoint: bundle.product.reorderPoint,
  };
}

function mapOrder(bundle: OrderBundle): Order {
  return {
    id: bundle.order.id,
    organizationId: bundle.organization.id,
    organizationCode: bundle.organization.code,
    organizationName: bundle.organization.name,
    orderNumber: bundle.order.orderNumber,
    customerName: bundle.order.customerName,
    actorRole: bundle.order.actorRole,
    productSku: bundle.product.sku,
    productName: bundle.product.name,
    quantity: bundle.order.quantity,
    priority: bundle.order.priority,
    deliveryLocation: bundle.order.deliveryLocation,
    region: bundle.order.region,
    requestedDeliveryAt: bundle.order.requestedDeliveryAt.toISOString(),
    expectedDeliveryAt: bundle.order.expectedDeliveryAt.toISOString(),
    createdAt: bundle.order.createdAt.toISOString(),
    currentState: bundle.order.currentState,
    assignedWarehouseId: bundle.order.assignedWarehouseId ?? undefined,
    assignedCarrierId: bundle.order.assignedCarrierId ?? undefined,
    trackingCode: bundle.order.trackingCode,
    delayReason: bundle.order.delayReason ?? undefined,
    reassignmentCount: bundle.order.reassignmentCount,
    lastCheckedAt: bundle.order.lastCheckedAt.toISOString(),
    lastUpdatedAt: bundle.order.lastUpdatedAt.toISOString(),
    transitStartedAt: toIso(bundle.order.transitStartedAt),
    deliveredAt: toIso(bundle.order.deliveredAt),
  };
}

function mapWorkflowLog(log: typeof workflowLogs.$inferSelect): WorkflowLog {
  return {
    id: log.id,
    orderId: log.orderId,
    actor: log.actor,
    action: log.action,
    summary: log.summary,
    timestamp: log.createdAt.toISOString(),
    fromState: log.fromState ?? undefined,
    toState: log.toState ?? undefined,
  };
}

async function loadOrderBundles(
  executor: DbExecutor,
  options?: {
    orderId?: string;
    viewer?: AuthenticatedUser;
  }
): Promise<OrderBundle[]> {
  const scopedOrganizationId = options?.viewer
    ? getScopedOrganizationId(options.viewer)
    : undefined;

  const baseQuery = executor
    .select({
      order: orders,
      organization: organizations,
      product: products,
      warehouse: warehouses,
      carrier: carriers,
    })
    .from(orders)
    .innerJoin(organizations, eq(orders.organizationId, organizations.id))
    .innerJoin(products, eq(orders.productId, products.id))
    .leftJoin(warehouses, eq(orders.assignedWarehouseId, warehouses.id))
    .leftJoin(carriers, eq(orders.assignedCarrierId, carriers.id));

  if (options?.orderId && scopedOrganizationId) {
    return baseQuery
      .where(
        and(
          eq(orders.id, options.orderId),
          eq(orders.organizationId, scopedOrganizationId)
        )
      )
      .orderBy(desc(orders.createdAt));
  }

  if (options?.orderId) {
    return baseQuery
      .where(eq(orders.id, options.orderId))
      .orderBy(desc(orders.createdAt));
  }

  if (scopedOrganizationId) {
    return baseQuery
      .where(eq(orders.organizationId, scopedOrganizationId))
      .orderBy(desc(orders.createdAt));
  }

  return baseQuery.orderBy(desc(orders.createdAt));
}

async function loadInventoryBundles(
  executor: DbExecutor,
  options?: {
    organizationId?: string;
    productId?: string;
  }
): Promise<InventoryBundle[]> {
  const baseQuery = executor
    .select({
      inventory: warehouseInventory,
      product: products,
      organization: organizations,
      warehouse: warehouses,
    })
    .from(warehouseInventory)
    .innerJoin(products, eq(warehouseInventory.productId, products.id))
    .innerJoin(organizations, eq(products.organizationId, organizations.id))
    .innerJoin(warehouses, eq(warehouseInventory.warehouseId, warehouses.id));

  if (options?.productId && options.organizationId) {
    return baseQuery.where(
      and(
        eq(warehouseInventory.productId, options.productId),
        eq(products.organizationId, options.organizationId)
      )
    );
  }

  if (options?.productId) {
    return baseQuery.where(eq(warehouseInventory.productId, options.productId));
  }

  if (options?.organizationId) {
    return baseQuery.where(eq(products.organizationId, options.organizationId));
  }

  return baseQuery;
}

async function loadProductBundles(
  executor: DbExecutor,
  organizationId?: string
): Promise<ProductBundle[]> {
  const baseQuery = executor
    .select({
      product: products,
      organization: organizations,
    })
    .from(products)
    .innerJoin(organizations, eq(products.organizationId, organizations.id));

  if (organizationId) {
    return baseQuery
      .where(eq(products.organizationId, organizationId))
      .orderBy(organizations.name, products.name);
  }

  return baseQuery.orderBy(organizations.name, products.name);
}

async function loadOrganizations(
  executor: DbExecutor,
  organizationId?: string
): Promise<(typeof organizations.$inferSelect)[]> {
  const baseQuery = executor.select().from(organizations);

  if (organizationId) {
    return baseQuery
      .where(eq(organizations.id, organizationId))
      .orderBy(organizations.name);
  }

  return baseQuery.orderBy(organizations.name);
}

async function loadRecentLogs(
  executor: DbExecutor,
  options?: {
    limit?: number;
    organizationId?: string;
  }
): Promise<LogBundle[]> {
  const limit = options?.limit ?? 10;
  const baseQuery = executor
    .select({
      log: workflowLogs,
      orderNumber: orders.orderNumber,
    })
    .from(workflowLogs)
    .innerJoin(orders, eq(workflowLogs.orderId, orders.id));

  const rows = options?.organizationId
    ? await baseQuery
        .where(eq(orders.organizationId, options.organizationId))
        .orderBy(desc(workflowLogs.createdAt))
        .limit(limit)
    : await baseQuery.orderBy(desc(workflowLogs.createdAt)).limit(limit);

  return rows as LogBundle[];
}

async function loadLatestAutomationRun(
  executor: DbExecutor,
  organizationId?: string
): Promise<typeof automationRuns.$inferSelect | null> {
  const [latestRun] = organizationId
    ? await executor
        .select()
        .from(automationRuns)
        .where(eq(automationRuns.organizationId, organizationId))
        .orderBy(desc(automationRuns.createdAt))
        .limit(1)
    : await executor
        .select()
        .from(automationRuns)
        .orderBy(desc(automationRuns.createdAt))
        .limit(1);

  return latestRun ?? null;
}

function createMeta(
  orderBundles: OrderBundle[],
  recentLogs: LogBundle[],
  latestAutomationRun: typeof automationRuns.$inferSelect | null,
  scopeLabel: string
): StoreMeta {
  const dates = [
    ...orderBundles.flatMap((bundle) => [
      bundle.order.createdAt,
      bundle.order.lastUpdatedAt,
    ]),
    ...recentLogs.map((entry) => entry.log.createdAt),
    ...(latestAutomationRun ? [latestAutomationRun.createdAt] : []),
  ].map((value) => toDate(value));

  const sortedDates = [...dates].sort(
    (left, right) => left.getTime() - right.getTime()
  );
  const seededAt = sortedDates[0] ?? new Date();
  const updatedAt = sortedDates.at(-1) ?? new Date();
  const summaries = latestAutomationRun?.summary
    ? latestAutomationRun.summary.split("\n").filter(Boolean)
    : ["Automation has not been executed yet."];

  return {
    version: 3,
    seededAt: seededAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    lastAutomationRunAt: (
      latestAutomationRun?.createdAt ?? updatedAt
    ).toISOString(),
    lastAutomationSummary: summaries,
    scopeLabel,
  };
}

function selectWarehouseCandidate(
  inventoryRows: InventoryBundle[],
  region: Region,
  quantity: number,
  excludeWarehouseId?: string
) {
  const candidates = inventoryRows
    .filter(
      (entry) =>
        !excludeWarehouseId || entry.warehouse.id !== excludeWarehouseId
    )
    .filter(
      (entry) =>
        entry.inventory.availableUnits - entry.inventory.reservedUnits >=
        quantity
    )
    .sort((left, right) => {
      const regionScore =
        Number(right.warehouse.region === region) -
        Number(left.warehouse.region === region);

      if (regionScore !== 0) {
        return regionScore;
      }

      const capacityScore =
        right.warehouse.capacityScore - left.warehouse.capacityScore;

      if (capacityScore !== 0) {
        return capacityScore;
      }

      return left.warehouse.handlingHours - right.warehouse.handlingHours;
    });

  return candidates[0] ?? null;
}

function selectCarrierCandidate(
  carrierRows: (typeof carriers.$inferSelect)[],
  region: Region,
  excludeCarrierId?: string
) {
  const candidates = carrierRows
    .filter((carrier) => carrier.id !== excludeCarrierId)
    .filter((carrier) => carrier.status !== "offline")
    .filter((carrier) => carrier.supportedRegions.includes(region))
    .sort((left, right) => {
      const statusWeight =
        (right.status === "active" ? 2 : 1) -
        (left.status === "active" ? 2 : 1);

      if (statusWeight !== 0) {
        return statusWeight;
      }

      const reliability = right.reliabilityScore - left.reliabilityScore;

      if (reliability !== 0) {
        return reliability;
      }

      return left.averageEtaHours - right.averageEtaHours;
    });

  return candidates[0] ?? null;
}

async function insertWorkflowLog(
  executor: DbExecutor,
  orderId: string,
  actor: UserRole,
  action: string,
  summary: string,
  fromState?: OrderState,
  toState?: OrderState,
  createdAt = new Date()
) {
  await executor.insert(workflowLogs).values({
    orderId,
    actor,
    action,
    summary,
    fromState,
    toState,
    createdAt,
  });
}

async function settleInventoryForDelivery(
  executor: DbExecutor,
  warehouseId: string,
  productId: string,
  quantity: number,
  now: Date
) {
  await executor
    .update(warehouseInventory)
    .set({
      reservedUnits: sql`GREATEST(${warehouseInventory.reservedUnits} - ${quantity}, 0)`,
      availableUnits: sql`GREATEST(${warehouseInventory.availableUnits} - ${quantity}, 0)`,
      updatedAt: now,
    })
    .where(
      and(
        eq(warehouseInventory.warehouseId, warehouseId),
        eq(warehouseInventory.productId, productId)
      )
    );
}

async function deliverOrder(
  executor: DbExecutor,
  bundle: OrderBundle,
  actor: UserRole,
  note: string
) {
  const now = new Date();

  await executor
    .update(orders)
    .set({
      currentState: "delivered",
      delayReason: null,
      lastCheckedAt: now,
      lastUpdatedAt: now,
      deliveredAt: now,
    })
    .where(eq(orders.id, bundle.order.id));

  if (bundle.order.assignedWarehouseId) {
    await settleInventoryForDelivery(
      executor,
      bundle.order.assignedWarehouseId,
      bundle.order.productId,
      bundle.order.quantity,
      now
    );
  }

  await insertWorkflowLog(
    executor,
    bundle.order.id,
    actor,
    "Delivered",
    note,
    bundle.order.currentState,
    "delivered",
    now
  );
}

function buildWorkflowStats(orderBundles: OrderBundle[]): WorkflowStat[] {
  const total = orderBundles.length;
  const active = orderBundles.filter(
    (bundle) => bundle.order.currentState !== "delivered"
  ).length;
  const delayed = orderBundles.filter(
    (bundle) => bundle.order.currentState === "delayed"
  ).length;
  const deliveredToday = orderBundles.filter((bundle) => {
    if (!bundle.order.deliveredAt) {
      return false;
    }

    return differenceInHours(new Date(), bundle.order.deliveredAt) <= 24;
  }).length;
  const fillRate = total === 0 ? 0 : Math.round((deliveredToday / total) * 100);

  return [
    {
      label: "Total orders",
      value: `${total}`,
      hint: "Orders currently visible inside the active scope.",
      tone: "ink",
    },
    {
      label: "Active workflows",
      value: `${active}`,
      hint: "Orders still moving through allocation, transit, or recovery.",
      tone: "teal",
    },
    {
      label: "Delay alerts",
      value: `${delayed}`,
      hint: "Shipments currently outside the expected delivery window.",
      tone: delayed > 0 ? "coral" : "amber",
    },
    {
      label: "Recent fill rate",
      value: `${fillRate}%`,
      hint: "Delivered in the last 24 hours against the visible workload.",
      tone: "amber",
    },
  ];
}

function buildInventorySignals(rows: InventoryBundle[]): InventorySignal[] {
  const grouped = new Map<string, InventoryBundle[]>();

  for (const row of rows) {
    const key = row.product.id;
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }

  return [...grouped.values()].map((group) => {
    const [sample] = group;
    const availableUnits = group.reduce(
      (sum, entry) =>
        sum + entry.inventory.availableUnits - entry.inventory.reservedUnits,
      0
    );
    const reservedUnits = group.reduce(
      (sum, entry) => sum + entry.inventory.reservedUnits,
      0
    );
    const primaryWarehouse = [...group].sort(
      (left, right) =>
        right.inventory.availableUnits - left.inventory.availableUnits
    )[0].warehouse.name;
    const threshold = sample.product.reorderPoint;
    const status =
      availableUnits <= threshold
        ? "critical"
        : availableUnits <= threshold * 1.5
          ? "watch"
          : "healthy";

    return {
      organizationCode: sample.organization.code,
      organizationName: sample.organization.name,
      sku: sample.product.sku,
      name: sample.product.name,
      category: sample.product.category,
      availableUnits,
      reservedUnits,
      reorderPoint: sample.product.reorderPoint,
      primaryWarehouse,
      status,
    };
  });
}

function buildCarrierSignals(
  carrierRows: (typeof carriers.$inferSelect)[],
  orderBundles: OrderBundle[]
): CarrierSignal[] {
  return carrierRows.map((carrier) => ({
    id: carrier.id,
    name: carrier.name,
    status: carrier.status,
    activeOrders: orderBundles.filter(
      (bundle) =>
        bundle.order.assignedCarrierId === carrier.id &&
        bundle.order.currentState !== "delivered"
    ).length,
    reliabilityScore: carrier.reliabilityScore,
    averageEtaHours: carrier.averageEtaHours,
  }));
}

function buildWarehouseSignals(
  warehouseRows: (typeof warehouses.$inferSelect)[],
  inventoryRows: InventoryBundle[],
  orderBundles: OrderBundle[]
): WarehouseSignal[] {
  return warehouseRows.map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name,
    region: warehouse.region,
    openOrders: orderBundles.filter(
      (bundle) =>
        bundle.order.assignedWarehouseId === warehouse.id &&
        bundle.order.currentState !== "delivered"
    ).length,
    capacityScore: warehouse.capacityScore,
    lowStockSkus: inventoryRows.filter(
      (row) =>
        row.warehouse.id === warehouse.id &&
        row.inventory.availableUnits - row.inventory.reservedUnits <=
          row.inventory.safetyStock
    ).length,
  }));
}

function buildDelayAlerts(orderBundles: OrderBundle[]): DelayAlert[] {
  return orderBundles
    .filter((bundle) => bundle.order.currentState === "delayed")
    .map((bundle) => ({
      orderId: bundle.order.id,
      organizationName: bundle.organization.name,
      customerName: bundle.order.customerName,
      reason: bundle.order.delayReason ?? "Delay threshold crossed.",
      carrierName: bundle.carrier?.name ?? "Unassigned",
      warehouseName: bundle.warehouse?.name ?? "Unassigned",
      hoursPastDue: Math.max(
        0,
        differenceInHours(new Date(), bundle.order.expectedDeliveryAt)
      ),
    }))
    .sort((left, right) => right.hoursPastDue - left.hoursPastDue);
}

function buildStateCounts(orderBundles: OrderBundle[]) {
  return ORDER_STATE_SEQUENCE.map((state) => ({
    state,
    count: orderBundles.filter((bundle) => bundle.order.currentState === state)
      .length,
    description: ORDER_STATE_DESCRIPTIONS[state],
  }));
}

async function getMappedOrderById(
  executor: DbExecutor,
  viewer: AuthenticatedUser,
  orderId: string
) {
  const bundle = await getOrderBundleById(executor, viewer, orderId);
  return mapOrder(bundle);
}

function validateOrderInput(input: CreateOrderInput): CreateOrderInput {
  return {
    customerName: normalizeText(input.customerName, "Customer name"),
    organizationId:
      typeof input.organizationId === "string" && input.organizationId.trim()
        ? input.organizationId.trim()
        : undefined,
    productSku: normalizeText(input.productSku, "Product"),
    quantity: normalizeQuantity(input.quantity),
    deliveryLocation: normalizeText(input.deliveryLocation, "Delivery location"),
    region: normalizeEnum(
      input.region,
      ["north", "west", "south", "east", "central"],
      "Region"
    ),
    priority: normalizeEnum(
      input.priority,
      ["standard", "express", "critical"],
      "Priority"
    ),
    requestedDeliveryAt: normalizeFutureDate(input.requestedDeliveryAt).toISOString(),
  };
}

async function getOrderBundleById(
  executor: DbExecutor,
  viewer: AuthenticatedUser,
  orderId: string
) {
  const [bundle] = await loadOrderBundles(executor, { orderId, viewer });

  if (!bundle) {
    throw new SupplyChainError("Order not found.", 404, "order_not_found");
  }

  return bundle as OrderBundle;
}

export async function listOrders(viewer: AuthenticatedUser) {
  const db = getDb();
  const bundles = await loadOrderBundles(db, { viewer });
  return bundles.map(mapOrder);
}

export async function getOrderById(viewer: AuthenticatedUser, orderId: string) {
  const db = getDb();
  const bundle = await getOrderBundleById(db, viewer, orderId);
  return mapOrder(bundle);
}

export async function getDashboardSnapshot(
  viewer: AuthenticatedUser
): Promise<DashboardSnapshot> {
  const db = getDb();
  const scopedOrganizationId = getScopedOrganizationId(viewer);
  const [
    orderBundles,
    inventoryRows,
    recentLogs,
    latestRun,
    carrierRows,
    productRows,
    warehouseRows,
    organizationRows,
  ] = await Promise.all([
    loadOrderBundles(db, { viewer }),
    loadInventoryBundles(db, { organizationId: scopedOrganizationId }),
    loadRecentLogs(db, { limit: 12, organizationId: scopedOrganizationId }),
    loadLatestAutomationRun(db, scopedOrganizationId),
    db.select().from(carriers),
    loadProductBundles(db, scopedOrganizationId),
    db.select().from(warehouses),
    loadOrganizations(db, scopedOrganizationId),
  ]);

  const warehouseIdsInScope = new Set<string>([
    ...inventoryRows.map((row) => row.warehouse.id),
    ...orderBundles
      .map((bundle) => bundle.warehouse?.id)
      .filter((value): value is string => Boolean(value)),
  ]);

  const warehousesForView = scopedOrganizationId
    ? warehouseRows.filter((warehouse) => warehouseIdsInScope.has(warehouse.id))
    : warehouseRows;
  const carriersForView = scopedOrganizationId
    ? carrierRows.filter((carrier) =>
        orderBundles.some((bundle) => bundle.order.assignedCarrierId === carrier.id)
      )
    : carrierRows;

  return {
    meta: createMeta(
      orderBundles,
      recentLogs,
      latestRun,
      viewer.organizationName ?? "All organizations"
    ),
    organizations: organizationRows.map(mapOrganization),
    products: productRows.map(mapProduct),
    warehouses: warehousesForView.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      city: warehouse.city,
      region: warehouse.region,
      handlingHours: warehouse.handlingHours,
      capacityScore: warehouse.capacityScore,
    })),
    carriers: carriersForView.map((carrier) => ({
      id: carrier.id,
      name: carrier.name,
      status: carrier.status,
      averageEtaHours: carrier.averageEtaHours,
      reliabilityScore: carrier.reliabilityScore,
      supportedRegions: carrier.supportedRegions as Region[],
      delayBiasHours: carrier.delayBiasHours,
    })) as Carrier[],
    orders: orderBundles.map(mapOrder),
    workflowStats: buildWorkflowStats(orderBundles),
    inventorySignals: buildInventorySignals(inventoryRows),
    carrierSignals: buildCarrierSignals(carriersForView, orderBundles),
    warehouseSignals: buildWarehouseSignals(
      warehousesForView,
      inventoryRows,
      orderBundles
    ),
    delayAlerts: buildDelayAlerts(orderBundles),
    recentLogs: recentLogs.map((entry) =>
      mapWorkflowLog({
        ...entry.log,
        summary: `${entry.orderNumber}: ${entry.log.summary}`,
      })
    ),
    stateCounts: buildStateCounts(orderBundles),
  };
}

export async function createOrder(viewer: AuthenticatedUser, input: CreateOrderInput) {
  const db = getDb();
  const payload = validateOrderInput(input);

  return db.transaction(async (tx) => {
    const scopedOrganizationId = getScopedOrganizationId(viewer);
    const organizationId = scopedOrganizationId ?? payload.organizationId;

    if (!organizationId) {
      throw new SupplyChainError(
        "Choose an organization before creating the order.",
        400,
        "missing_organization"
      );
    }

    const [organization] = await tx
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      throw new SupplyChainError(
        "Selected organization does not exist.",
        404,
        "organization_not_found"
      );
    }

    const [product] = await tx
      .select()
      .from(products)
      .where(
        and(
          eq(products.sku, payload.productSku),
          eq(products.organizationId, organization.id)
        )
      )
      .limit(1);

    if (!product) {
      throw new SupplyChainError(
        "Selected product does not exist for this organization.",
        404,
        "product_not_found"
      );
    }

    const inventoryRows = await loadInventoryBundles(tx, {
      productId: product.id,
      organizationId: organization.id,
    });
    const selectedInventory = selectWarehouseCandidate(
      inventoryRows,
      payload.region,
      payload.quantity
    );

    if (!selectedInventory) {
      throw new SupplyChainError(
        "Insufficient stock across the current warehouse network.",
        409,
        "insufficient_stock"
      );
    }

    const carrierRows = await tx.select().from(carriers);
    const selectedCarrier = selectCarrierCandidate(carrierRows, payload.region);

    if (!selectedCarrier) {
      throw new SupplyChainError(
        "No active carrier is available for the selected region.",
        409,
        "carrier_unavailable"
      );
    }

    const now = new Date();
    const expectedDeliveryAt = calculateExpectedDeliveryAt(
      now,
      selectedInventory.warehouse.handlingHours,
      selectedCarrier.averageEtaHours + selectedCarrier.delayBiasHours,
      payload.priority
    );

    const [createdOrder] = await tx
      .insert(orders)
      .values({
        organizationId: organization.id,
        orderNumber: createOrderNumber(),
        customerName: payload.customerName,
        actorRole: viewer.role,
        productId: product.id,
        quantity: payload.quantity,
        priority: payload.priority,
        deliveryLocation: payload.deliveryLocation,
        region: payload.region,
        requestedDeliveryAt: new Date(payload.requestedDeliveryAt),
        expectedDeliveryAt,
        currentState: "assigned",
        assignedWarehouseId: selectedInventory.warehouse.id,
        assignedCarrierId: selectedCarrier.id,
        trackingCode: createTrackingCode(),
        delayReason: null,
        reassignmentCount: 0,
        createdAt: now,
        lastCheckedAt: now,
        lastUpdatedAt: now,
      })
      .returning();

    await tx
      .update(warehouseInventory)
      .set({
        reservedUnits: sql`${warehouseInventory.reservedUnits} + ${payload.quantity}`,
        updatedAt: now,
      })
      .where(eq(warehouseInventory.id, selectedInventory.inventory.id));

    await insertWorkflowLog(
      tx,
      createdOrder.id,
      viewer.role,
      "Order created",
      `${payload.customerName} submitted ${payload.quantity} units of ${product.name} for ${organization.name}.`,
      undefined,
      "created",
      now
    );

    await insertWorkflowLog(
      tx,
      createdOrder.id,
      "automated_system",
      "Inventory and logistics assigned",
      `${selectedInventory.warehouse.name} and ${selectedCarrier.name} were allocated automatically.`,
      "created",
      "assigned",
      now
    );

    const bundle = await getOrderBundleById(tx, viewer, createdOrder.id);

    return {
      message: "Order created and routed successfully.",
      order: mapOrder(bundle),
    };
  });
}

export async function updateOrder(
  viewer: AuthenticatedUser,
  orderId: string,
  input: OrderMutationInput
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const bundle = await getOrderBundleById(tx, viewer, orderId);

    if (input.action === "MARK_DELIVERED") {
      if (bundle.order.currentState === "delivered") {
        return {
          message: "Order is already delivered.",
          order: mapOrder(bundle),
        };
      }

      await deliverOrder(
        tx,
        bundle,
        input.actorRole ?? viewer.role,
        input.note ?? "Order manually confirmed as delivered by an administrator."
      );

      return {
        message: "Order marked as delivered.",
        order: await getMappedOrderById(tx, viewer, orderId),
      };
    }

    const now = new Date();
    const carrierRows = await tx.select().from(carriers);
    const inventoryRows = await loadInventoryBundles(tx, {
      productId: bundle.order.productId,
      organizationId: bundle.order.organizationId,
    });

    const nextCarrier = input.carrierId
      ? carrierRows.find((carrier) => carrier.id === input.carrierId) ?? null
      : selectCarrierCandidate(
          carrierRows,
          bundle.order.region,
          bundle.order.assignedCarrierId ?? undefined
        );
    const nextWarehouse = input.warehouseId
      ? inventoryRows.find((row) => row.warehouse.id === input.warehouseId) ?? null
      : null;

    if (input.warehouseId && !nextWarehouse) {
      throw new SupplyChainError("Requested warehouse does not exist.", 404, "warehouse_not_found");
    }

    if (input.carrierId && !nextCarrier) {
      throw new SupplyChainError("Requested carrier does not exist.", 404, "carrier_not_found");
    }

    if (nextWarehouse && bundle.order.transitStartedAt) {
      throw new SupplyChainError(
        "Warehouse cannot be changed after transit has started.",
        409,
        "warehouse_locked"
      );
    }

    const targetWarehouse = nextWarehouse?.warehouse ?? bundle.warehouse;
    const targetCarrier = nextCarrier ?? bundle.carrier;

    if (!targetWarehouse || !targetCarrier) {
      throw new SupplyChainError(
        "A complete warehouse and carrier assignment is required.",
        409,
        "assignment_incomplete"
      );
    }

    if (
      nextWarehouse &&
      bundle.order.assignedWarehouseId &&
      nextWarehouse.warehouse.id !== bundle.order.assignedWarehouseId
    ) {
      await tx
        .update(warehouseInventory)
        .set({
          reservedUnits: sql`GREATEST(${warehouseInventory.reservedUnits} - ${bundle.order.quantity}, 0)`,
          updatedAt: now,
        })
        .where(
          and(
            eq(warehouseInventory.warehouseId, bundle.order.assignedWarehouseId),
            eq(warehouseInventory.productId, bundle.order.productId)
          )
        );

      await tx
        .update(warehouseInventory)
        .set({
          reservedUnits: sql`${warehouseInventory.reservedUnits} + ${bundle.order.quantity}`,
          updatedAt: now,
        })
        .where(eq(warehouseInventory.id, nextWarehouse.inventory.id));
    }

    const expectedDeliveryAt = calculateExpectedDeliveryAt(
      now,
      targetWarehouse.handlingHours,
      targetCarrier.averageEtaHours + targetCarrier.delayBiasHours,
      bundle.order.priority
    );

    await tx
      .update(orders)
      .set({
        assignedWarehouseId: targetWarehouse.id,
        assignedCarrierId: targetCarrier.id,
        currentState: "reassigned",
        delayReason: null,
        reassignmentCount: bundle.order.reassignmentCount + 1,
        expectedDeliveryAt,
        lastCheckedAt: now,
        lastUpdatedAt: now,
      })
      .where(eq(orders.id, bundle.order.id));

    await insertWorkflowLog(
      tx,
      bundle.order.id,
      input.actorRole ?? viewer.role,
      "Admin reassignment",
      input.note ??
        `${targetWarehouse.name} and ${targetCarrier.name} were selected as the recovery route.`,
      bundle.order.currentState,
      "reassigned",
      now
    );

    return {
      message: "Order reassigned successfully.",
      order: await getMappedOrderById(tx, viewer, orderId),
    };
  });
}

export async function runAutomationCycle(viewer: AuthenticatedUser) {
  const db = getDb();
  const scopedOrganizationId = getScopedOrganizationId(viewer);

  return db.transaction(async (tx) => {
    const now = new Date();
    const orderBundles = await loadOrderBundles(tx, { viewer });
    const carrierRows = await tx.select().from(carriers);
    const summaries: string[] = [];

    for (const bundle of orderBundles) {
      if (bundle.order.currentState === "delivered") {
        continue;
      }

      const hoursSinceCreate = differenceInHours(now, bundle.order.createdAt);
      const hoursUntilEta = differenceInHours(bundle.order.expectedDeliveryAt, now);
      const hoursPastEta = differenceInHours(now, bundle.order.expectedDeliveryAt);

      if (bundle.order.currentState === "assigned" && hoursSinceCreate >= 1) {
        await tx
          .update(orders)
          .set({
            currentState: "in_transit",
            transitStartedAt: now,
            lastCheckedAt: now,
            lastUpdatedAt: now,
          })
          .where(eq(orders.id, bundle.order.id));

        await insertWorkflowLog(
          tx,
          bundle.order.id,
          "automated_system",
          "Transit released",
          `${bundle.carrier?.name ?? "Assigned carrier"} moved the order into active transit.`,
          "assigned",
          "in_transit",
          now
        );

        summaries.push(`${bundle.order.orderNumber} advanced to in-transit.`);
        continue;
      }

      if (bundle.order.currentState === "in_transit") {
        const carrierDegraded = bundle.carrier?.status === "degraded";

        if (carrierDegraded || hoursPastEta >= 0) {
          const delayReason = carrierDegraded
            ? "Carrier flagged degraded service before final delivery."
            : `Shipment is ${hoursPastEta.toFixed(1)} hours beyond ETA.`;

          await tx
            .update(orders)
            .set({
              currentState: "delayed",
              delayReason,
              lastCheckedAt: now,
              lastUpdatedAt: now,
            })
            .where(eq(orders.id, bundle.order.id));

          await insertWorkflowLog(
            tx,
            bundle.order.id,
            "automated_system",
            "Delay detected",
            delayReason,
            "in_transit",
            "delayed",
            now
          );

          summaries.push(`${bundle.order.orderNumber} was flagged as delayed.`);
          continue;
        }

        if (hoursUntilEta <= 1.5 && bundle.carrier?.status === "active") {
          await deliverOrder(
            tx,
            bundle,
            "automated_system",
            `${bundle.order.orderNumber} cleared its final checkpoint and was delivered.`
          );
          summaries.push(`${bundle.order.orderNumber} was delivered automatically.`);
        }

        continue;
      }

      if (bundle.order.currentState === "delayed") {
        const nextCarrier = selectCarrierCandidate(
          carrierRows,
          bundle.order.region,
          bundle.order.assignedCarrierId ?? undefined
        );

        if (!nextCarrier || !bundle.warehouse) {
          summaries.push(`${bundle.order.orderNumber} remains delayed awaiting manual action.`);
          continue;
        }

        const expectedDeliveryAt = calculateExpectedDeliveryAt(
          now,
          bundle.warehouse.handlingHours,
          nextCarrier.averageEtaHours + nextCarrier.delayBiasHours,
          bundle.order.priority
        );

        await tx
          .update(orders)
          .set({
            assignedCarrierId: nextCarrier.id,
            currentState: "reassigned",
            delayReason: null,
            reassignmentCount: bundle.order.reassignmentCount + 1,
            expectedDeliveryAt,
            lastCheckedAt: now,
            lastUpdatedAt: now,
          })
          .where(eq(orders.id, bundle.order.id));

        await insertWorkflowLog(
          tx,
          bundle.order.id,
          "automated_system",
          "Automatic reassignment",
          `${nextCarrier.name} was selected to recover the delayed order.`,
          "delayed",
          "reassigned",
          now
        );

        summaries.push(`${bundle.order.orderNumber} was reassigned to ${nextCarrier.name}.`);
        continue;
      }

      if (bundle.order.currentState === "reassigned" && bundle.carrier?.status === "active") {
        if (hoursUntilEta <= 1.5) {
          await deliverOrder(
            tx,
            bundle,
            "automated_system",
            `${bundle.order.orderNumber} arrived after reassignment recovery.`
          );
          summaries.push(`${bundle.order.orderNumber} recovered and delivered.`);
        }
      }
    }

    const finalSummary = summaries.length
      ? summaries
      : ["All active shipments remain on their current plan."];

    await tx.insert(automationRuns).values({
      organizationId: scopedOrganizationId ?? null,
      summary: finalSummary.join("\n"),
      actionsCount: finalSummary.length,
      createdAt: now,
    });

    return {
      ranAt: now.toISOString(),
      summary: finalSummary,
    };
  });
}
