import { and, eq, gte, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orders, organizations, products } from "@/lib/db/schema";
import type { AuthenticatedUser } from "@/lib/supply-chain/types";
import type {
  FinancialKpis,
  MonthlyTick,
  OrgRevenue,
  PipelineSlice,
  TopProduct,
} from "@/lib/analytics/types";

// Gross margin assumption — realistic for distribution/manufacturing.
// Revenue × (1 − COGS_RATIO) = Gross Profit
const COGS_RATIO = 0.62;

const ORDER_STATE_LABELS: Record<string, string> = {
  created: "Created",
  assigned: "Assigned",
  in_transit: "In Transit",
  delayed: "Delayed",
  reassigned: "Reassigned",
  delivered: "Delivered",
};

type OrderRow = {
  orderId: string;
  state: string;
  quantity: number;
  unitPrice: string;
  orgId: string;
  orgCode: string;
  orgName: string;
  productId: string;
  productSku: string;
  productName: string;
  deliveredAt: Date | null;
  createdAt: Date;
};

function rowRevenue(row: OrderRow): number {
  return row.quantity * Number(row.unitPrice);
}

function getScopeFilter(viewer: AuthenticatedUser) {
  if (viewer.role === "org_admin" && viewer.organizationId) {
    return viewer.organizationId;
  }
  return null;
}

async function fetchOrders(viewer: AuthenticatedUser): Promise<OrderRow[]> {
  const db = getDb();
  const scopedOrgId = getScopeFilter(viewer);

  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const baseQuery = db
    .select({
      orderId: orders.id,
      state: orders.currentState,
      quantity: orders.quantity,
      unitPrice: products.unitPrice,
      orgId: organizations.id,
      orgCode: organizations.code,
      orgName: organizations.name,
      productId: products.id,
      productSku: products.sku,
      productName: products.name,
      deliveredAt: orders.deliveredAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(organizations, eq(orders.organizationId, organizations.id))
    .where(
      scopedOrgId
        ? and(
            eq(orders.organizationId, scopedOrgId),
            gte(orders.createdAt, since)
          )
        : gte(orders.createdAt, since)
    );

  return baseQuery as unknown as Promise<OrderRow[]>;
}

export async function getFinancialKpis(
  viewer: AuthenticatedUser
): Promise<FinancialKpis> {
  const rows = await fetchOrders(viewer);

  const delivered = rows.filter((r) => r.state === "delivered");
  const pipeline = rows.filter(
    (r) => r.state === "assigned" || r.state === "in_transit"
  );

  const totalRevenue = delivered.reduce((s, r) => s + rowRevenue(r), 0);
  const grossProfit = totalRevenue * (1 - COGS_RATIO);
  const grossMarginPct =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const pipelineValue = pipeline.reduce((s, r) => s + rowRevenue(r), 0);
  const avgOrderValue =
    delivered.length > 0 ? totalRevenue / delivered.length : 0;

  return {
    totalRevenue,
    grossProfit,
    grossMarginPct,
    pipelineValue,
    avgOrderValue,
    deliveredOrderCount: delivered.length,
  };
}

export async function getRevenueTrend(
  viewer: AuthenticatedUser
): Promise<MonthlyTick[]> {
  const rows = await fetchOrders(viewer);
  const delivered = rows.filter(
    (r) => r.state === "delivered" && r.deliveredAt
  );

  const buckets = new Map<string, number>();

  // Build 12 empty month buckets in order
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  for (const row of delivered) {
    const d = row.deliveredAt!;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + rowRevenue(row));
    }
  }

  return Array.from(buckets.entries()).map(([key, revenue]) => {
    const [year, month] = key.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const cogs = revenue * COGS_RATIO;
    return {
      month: label,
      revenue: Math.round(revenue),
      cogs: Math.round(cogs),
      profit: Math.round(revenue - cogs),
    };
  });
}

export async function getTopProducts(
  viewer: AuthenticatedUser,
  limit = 7
): Promise<TopProduct[]> {
  const rows = await fetchOrders(viewer);
  const delivered = rows.filter((r) => r.state === "delivered");

  const map = new Map<
    string,
    { sku: string; name: string; revenue: number; units: number; orders: number }
  >();

  for (const row of delivered) {
    const existing = map.get(row.productId) ?? {
      sku: row.productSku,
      name: row.productName,
      revenue: 0,
      units: 0,
      orders: 0,
    };
    existing.revenue += rowRevenue(row);
    existing.units += row.quantity;
    existing.orders += 1;
    map.set(row.productId, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      revenue: Math.round(p.revenue),
      unitsSold: p.units,
      orderCount: p.orders,
    }));
}

export async function getPipelineBreakdown(
  viewer: AuthenticatedUser
): Promise<PipelineSlice[]> {
  const rows = await fetchOrders(viewer);

  const map = new Map<string, { count: number; value: number }>();

  for (const row of rows) {
    const existing = map.get(row.state) ?? { count: 0, value: 0 };
    existing.count += 1;
    existing.value += rowRevenue(row);
    map.set(row.state, existing);
  }

  const order = [
    "created",
    "assigned",
    "in_transit",
    "delayed",
    "reassigned",
    "delivered",
  ];

  return order
    .filter((s) => map.has(s))
    .map((s) => ({
      state: s,
      label: ORDER_STATE_LABELS[s] ?? s,
      count: map.get(s)!.count,
      value: Math.round(map.get(s)!.value),
    }));
}

export async function getRevenueByOrg(
  viewer: AuthenticatedUser
): Promise<OrgRevenue[]> {
  if (viewer.role === "org_admin") return [];

  const rows = await fetchOrders(viewer);
  const delivered = rows.filter((r) => r.state === "delivered");

  const map = new Map<
    string,
    { code: string; name: string; revenue: number }
  >();

  for (const row of delivered) {
    const existing = map.get(row.orgId) ?? {
      code: row.orgCode,
      name: row.orgName,
      revenue: 0,
    };
    existing.revenue += rowRevenue(row);
    map.set(row.orgId, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((o) => ({
      orgCode: o.code,
      orgName: o.name,
      revenue: Math.round(o.revenue),
      profit: Math.round(o.revenue * (1 - COGS_RATIO)),
    }));
}
