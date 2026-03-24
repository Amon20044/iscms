export type UserRole =
  | "owner"
  | "org_admin"
  | "admin"
  | "customer"
  | "automated_system";
export type OrderState =
  | "created"
  | "assigned"
  | "in_transit"
  | "delayed"
  | "reassigned"
  | "delivered";
export type CarrierStatus = "active" | "degraded" | "offline";
export type Priority = "standard" | "express" | "critical";
export type Region = "north" | "west" | "south" | "east" | "central";

export interface Product {
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  reorderPoint: number;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  region: Region;
  handlingHours: number;
  capacityScore: number;
}

export interface WarehouseInventory {
  id: string;
  warehouseId: string;
  sku: string;
  availableUnits: number;
  reservedUnits: number;
  safetyStock: number;
}

export interface Carrier {
  id: string;
  name: string;
  status: CarrierStatus;
  averageEtaHours: number;
  reliabilityScore: number;
  supportedRegions: Region[];
  delayBiasHours: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  actorRole: UserRole;
  productSku: string;
  productName: string;
  quantity: number;
  priority: Priority;
  deliveryLocation: string;
  region: Region;
  requestedDeliveryAt: string;
  expectedDeliveryAt: string;
  createdAt: string;
  currentState: OrderState;
  assignedWarehouseId?: string;
  assignedCarrierId?: string;
  trackingCode: string;
  delayReason?: string;
  reassignmentCount: number;
  lastCheckedAt: string;
  lastUpdatedAt: string;
  transitStartedAt?: string;
  deliveredAt?: string;
}

export interface WorkflowLog {
  id: string;
  orderId: string;
  actor: UserRole;
  action: string;
  summary: string;
  timestamp: string;
  fromState?: OrderState;
  toState?: OrderState;
}

export interface AuthenticatedUser {
  id: string;
  accountId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface InternalAccessUser {
  accountId: string;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  role: UserRole;
}

export interface StoreMeta {
  version: number;
  seededAt: string;
  updatedAt: string;
  lastAutomationRunAt: string;
  lastAutomationSummary: string[];
}

export interface WorkflowStat {
  label: string;
  value: string;
  hint: string;
  tone: "ink" | "teal" | "amber" | "coral";
}

export interface InventorySignal {
  sku: string;
  name: string;
  category: string;
  availableUnits: number;
  reservedUnits: number;
  reorderPoint: number;
  primaryWarehouse: string;
  status: "healthy" | "watch" | "critical";
}

export interface CarrierSignal {
  id: string;
  name: string;
  status: CarrierStatus;
  activeOrders: number;
  reliabilityScore: number;
  averageEtaHours: number;
}

export interface WarehouseSignal {
  id: string;
  name: string;
  region: Region;
  openOrders: number;
  capacityScore: number;
  lowStockSkus: number;
}

export interface DelayAlert {
  orderId: string;
  customerName: string;
  reason: string;
  carrierName: string;
  warehouseName: string;
  hoursPastDue: number;
}

export interface StateCount {
  state: OrderState;
  count: number;
  description: string;
}

export interface DashboardSnapshot {
  meta: StoreMeta;
  products: Product[];
  warehouses: Warehouse[];
  carriers: Carrier[];
  orders: Order[];
  workflowStats: WorkflowStat[];
  inventorySignals: InventorySignal[];
  carrierSignals: CarrierSignal[];
  warehouseSignals: WarehouseSignal[];
  delayAlerts: DelayAlert[];
  recentLogs: WorkflowLog[];
  stateCounts: StateCount[];
}

export interface CreateOrderInput {
  customerName: string;
  actorRole: UserRole;
  productSku: string;
  quantity: number;
  deliveryLocation: string;
  region: Region;
  priority: Priority;
  requestedDeliveryAt: string;
}

export interface OrderMutationInput {
  action: "MARK_DELIVERED" | "ADMIN_REASSIGN";
  actorRole?: UserRole;
  carrierId?: string;
  warehouseId?: string;
  note?: string;
}

export const ORDER_STATE_SEQUENCE: OrderState[] = [
  "created",
  "assigned",
  "in_transit",
  "delayed",
  "reassigned",
  "delivered",
];

export const ORDER_STATE_DESCRIPTIONS: Record<OrderState, string> = {
  created: "Order accepted and waiting for automated validation.",
  assigned: "Warehouse and carrier allocated by the orchestration engine.",
  in_transit: "Shipment is moving through the active logistics lane.",
  delayed: "Risk thresholds or carrier flags pushed the order out of SLA.",
  reassigned: "The system shifted the route to recover the shipment.",
  delivered: "Order reached destination and inventory has been settled.",
};

export const REGION_LABELS: Record<Region, string> = {
  north: "North Zone",
  west: "West Zone",
  south: "South Zone",
  east: "East Zone",
  central: "Central Zone",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  standard: "Standard",
  express: "Express",
  critical: "Critical",
};

export const CARRIER_STATUS_LABELS: Record<CarrierStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  offline: "Offline",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  org_admin: "Org Admin",
  admin: "Admin",
  customer: "Customer",
  automated_system: "Automation",
};

export const DASHBOARD_ROLES: UserRole[] = ["owner", "org_admin", "admin"];
