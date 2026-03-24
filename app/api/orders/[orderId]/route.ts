import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/app/api/_shared";
import { requireRouteUser } from "@/lib/auth/service";
import { getOrderById, updateOrder } from "@/lib/supply-chain/service";
import { DASHBOARD_ROLES } from "@/lib/supply-chain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireRouteUser(DASHBOARD_ROLES);
    const { orderId } = await context.params;
    const order = await getOrderById(user, orderId);
    return NextResponse.json({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireRouteUser(DASHBOARD_ROLES);
    const { orderId } = await context.params;
    const payload = await request.json();
    const result = await updateOrder(user, orderId, {
      ...payload,
      actorRole: user.role,
    });
    revalidatePath("/dashboard");
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
