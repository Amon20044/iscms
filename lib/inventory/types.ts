export interface AdjustInventoryInput {
  productId: string;
  warehouseId: string;
  availableUnits: number;
  safetyStock: number;
}

export interface InventoryRow {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  availableUnits: number;
  reservedUnits: number;
  safetyStock: number;
}

export type AdjustInventoryFormState =
  | { error?: string; success?: string }
  | undefined;
