"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardUser } from "@/lib/auth/service";
import {
  createCarrier,
  isCarrierError,
  setCarrierStatus,
} from "@/lib/carriers/service";
import type { CarrierFormState } from "@/lib/carriers/types";

export async function createCarrierAction(
  _state: CarrierFormState,
  formData: FormData
): Promise<CarrierFormState> {
  const viewer = await requireDashboardUser();

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const averageEtaHours = Number(formData.get("averageEtaHours"));
  const reliabilityScore = Number(formData.get("reliabilityScore"));
  const delayBiasHours = Number(formData.get("delayBiasHours") ?? 0);
  const supportedRegions = formData.getAll("supportedRegions").map(String);

  try {
    const carrier = await createCarrier(viewer, {
      code,
      name,
      status,
      averageEtaHours,
      reliabilityScore,
      delayBiasHours,
      supportedRegions,
    });

    revalidatePath("/dashboard/carriers");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");

    return { success: `Carrier "${carrier.name}" (${carrier.code}) registered successfully.` };
  } catch (error) {
    if (isCarrierError(error)) {
      return { error: error.message };
    }
    return { error: "Unable to create carrier. Please try again." };
  }
}

export async function setCarrierStatusAction(
  _state: CarrierFormState,
  formData: FormData
): Promise<CarrierFormState> {
  const viewer = await requireDashboardUser();

  const carrierId = String(formData.get("carrierId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  try {
    const carrier = await setCarrierStatus(viewer, { carrierId, status });

    revalidatePath("/dashboard/carriers");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");

    return { success: `${carrier.name} status set to "${status}".` };
  } catch (error) {
    if (isCarrierError(error)) {
      return { error: error.message };
    }
    return { error: "Unable to update carrier status. Please try again." };
  }
}
