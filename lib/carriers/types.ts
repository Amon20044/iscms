export interface CreateCarrierInput {
  code: string;
  name: string;
  status: string;
  averageEtaHours: number;
  reliabilityScore: number;
  delayBiasHours: number;
  supportedRegions: string[];
}

export interface SetCarrierStatusInput {
  carrierId: string;
  status: string;
}

export type CarrierFormState =
  | { error?: string; success?: string }
  | undefined;
