export interface CreateWarehouseInput {
  code: string;
  name: string;
  city: string;
  region: string;
  handlingHours: number;
  capacityScore: number;
}

export type WarehouseFormState =
  | { error?: string; success?: string }
  | undefined;
