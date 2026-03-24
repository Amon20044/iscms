import { NextResponse } from "next/server";
import { handleRouteError } from "@/app/api/_shared";
import { requireRouteUser } from "@/lib/auth/service";
import { getDashboardSnapshot } from "@/lib/supply-chain/service";
import { DASHBOARD_ROLES } from "@/lib/supply-chain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRouteUser(DASHBOARD_ROLES);
    const snapshot = await getDashboardSnapshot(user);
    return NextResponse.json(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}
