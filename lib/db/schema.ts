import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "org_admin",
  "admin",
  "customer",
  "automated_system",
]);

export const orderStateEnum = pgEnum("order_state", [
  "created",
  "assigned",
  "in_transit",
  "delayed",
  "reassigned",
  "delivered",
]);

export const priorityEnum = pgEnum("order_priority", [
  "standard",
  "express",
  "critical",
]);

export const carrierStatusEnum = pgEnum("carrier_status", [
  "active",
  "degraded",
  "offline",
]);

export const regionEnum = pgEnum("region", [
  "north",
  "west",
  "south",
  "east",
  "central",
]);

export const appUserProfiles = pgTable(
  "app_user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: text("auth_user_id").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").unique(),
    role: userRoleEnum("role").notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("app_user_profiles_role_idx").on(table.role)]
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => appUserProfiles.id, { onDelete: "cascade" }),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_accounts_profile_idx").on(table.profileId),
    index("auth_accounts_active_idx").on(table.isActive),
  ]
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => authAccounts.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_sessions_account_idx").on(table.accountId),
    index("auth_sessions_expires_idx").on(table.expiresAt),
  ]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    reorderPoint: integer("reorder_point").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("products_category_idx").on(table.category)]
);

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    region: regionEnum("region").notNull(),
    handlingHours: integer("handling_hours").notNull(),
    capacityScore: integer("capacity_score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("warehouses_region_idx").on(table.region),
    index("warehouses_city_idx").on(table.city),
  ]
);

export const carriers = pgTable(
  "carriers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    status: carrierStatusEnum("status").notNull().default("active"),
    averageEtaHours: integer("average_eta_hours").notNull(),
    reliabilityScore: integer("reliability_score").notNull(),
    delayBiasHours: integer("delay_bias_hours").notNull().default(0),
    supportedRegions: text("supported_regions")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("carriers_status_idx").on(table.status),
    index("carriers_reliability_idx").on(table.reliabilityScore),
  ]
);

export const warehouseInventory = pgTable(
  "warehouse_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    availableUnits: integer("available_units").notNull(),
    reservedUnits: integer("reserved_units").notNull().default(0),
    safetyStock: integer("safety_stock").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("warehouse_inventory_unique_idx").on(
      table.warehouseId,
      table.productId
    ),
    index("warehouse_inventory_available_idx").on(table.availableUnits),
  ]
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    customerName: text("customer_name").notNull(),
    actorRole: userRoleEnum("actor_role").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    priority: priorityEnum("priority").notNull().default("standard"),
    deliveryLocation: text("delivery_location").notNull(),
    region: regionEnum("region").notNull(),
    requestedDeliveryAt: timestamp("requested_delivery_at", {
      withTimezone: true,
    }).notNull(),
    expectedDeliveryAt: timestamp("expected_delivery_at", {
      withTimezone: true,
    }).notNull(),
    currentState: orderStateEnum("current_state").notNull().default("created"),
    assignedWarehouseId: uuid("assigned_warehouse_id").references(
      () => warehouses.id
    ),
    assignedCarrierId: uuid("assigned_carrier_id").references(() => carriers.id),
    trackingCode: text("tracking_code").notNull().unique(),
    delayReason: text("delay_reason"),
    reassignmentCount: integer("reassignment_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    transitStartedAt: timestamp("transit_started_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_state_idx").on(table.currentState),
    index("orders_region_idx").on(table.region),
    index("orders_expected_eta_idx").on(table.expectedDeliveryAt),
  ]
);

export const workflowLogs = pgTable(
  "workflow_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    actor: userRoleEnum("actor").notNull(),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
    fromState: orderStateEnum("from_state"),
    toState: orderStateEnum("to_state"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("workflow_logs_order_idx").on(table.orderId),
    index("workflow_logs_created_idx").on(table.createdAt),
  ]
);

export const automationRuns = pgTable(
  "automation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    summary: text("summary").notNull(),
    actionsCount: integer("actions_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("automation_runs_created_idx").on(table.createdAt)]
);

export const productRelations = relations(products, ({ many }) => ({
  inventoryRows: many(warehouseInventory),
  orders: many(orders),
}));

export const appUserProfileRelations = relations(
  appUserProfiles,
  ({ one }) => ({
    authAccount: one(authAccounts, {
      fields: [appUserProfiles.id],
      references: [authAccounts.profileId],
    }),
  })
);

export const authAccountRelations = relations(authAccounts, ({ many, one }) => ({
  profile: one(appUserProfiles, {
    fields: [authAccounts.profileId],
    references: [appUserProfiles.id],
  }),
  sessions: many(authSessions),
}));

export const authSessionRelations = relations(authSessions, ({ one }) => ({
  account: one(authAccounts, {
    fields: [authSessions.accountId],
    references: [authAccounts.id],
  }),
}));

export const warehouseRelations = relations(warehouses, ({ many }) => ({
  inventoryRows: many(warehouseInventory),
  assignedOrders: many(orders),
}));

export const carrierRelations = relations(carriers, ({ many }) => ({
  assignedOrders: many(orders),
}));

export const warehouseInventoryRelations = relations(
  warehouseInventory,
  ({ one }) => ({
    warehouse: one(warehouses, {
      fields: [warehouseInventory.warehouseId],
      references: [warehouses.id],
    }),
    product: one(products, {
      fields: [warehouseInventory.productId],
      references: [products.id],
    }),
  })
);

export const orderRelations = relations(orders, ({ one, many }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [orders.assignedWarehouseId],
    references: [warehouses.id],
  }),
  carrier: one(carriers, {
    fields: [orders.assignedCarrierId],
    references: [carriers.id],
  }),
  logs: many(workflowLogs),
}));

export const workflowLogRelations = relations(workflowLogs, ({ one }) => ({
  order: one(orders, {
    fields: [workflowLogs.orderId],
    references: [orders.id],
  }),
}));
