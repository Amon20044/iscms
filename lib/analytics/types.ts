export interface FinancialKpis {
  totalRevenue: number;
  grossProfit: number;
  grossMarginPct: number;
  pipelineValue: number;
  avgOrderValue: number;
  deliveredOrderCount: number;
}

export interface MonthlyTick {
  month: string;      // "Jan 25"
  revenue: number;
  cogs: number;
  profit: number;
}

export interface TopProduct {
  sku: string;
  name: string;
  revenue: number;
  unitsSold: number;
  orderCount: number;
}

export interface PipelineSlice {
  state: string;
  label: string;
  count: number;
  value: number;
}

export interface OrgRevenue {
  orgCode: string;
  orgName: string;
  revenue: number;
  profit: number;
}
