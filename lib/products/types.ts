export interface CreateProductInput {
  organizationId: string;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  reorderPoint: number;
}

export type CreateProductFormState =
  | { error?: string; success?: string }
  | undefined;
