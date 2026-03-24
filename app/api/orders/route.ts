import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/app/api/_shared";
import { requireRouteUser } from "@/lib/auth/service";
import { createOrder, listOrders } from "@/lib/supply-chain/service";
import { DASHBOARD_ROLES } from "@/lib/supply-chain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRouteUser(DASHBOARD_ROLES);
    const orders = await listOrders(user);
    return NextResponse.json({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser(DASHBOARD_ROLES);
    const payload = await request.json();
    const result = await createOrder(user, payload);
    revalidatePath("/dashboard");
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
