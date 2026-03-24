import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/app/api/_shared";
import { requireRouteUser } from "@/lib/auth/service";
import { runAutomationCycle } from "@/lib/supply-chain/service";
import { DASHBOARD_ROLES } from "@/lib/supply-chain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireRouteUser(DASHBOARD_ROLES);
    const result = await runAutomationCycle();
    revalidatePath("/dashboard");
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
