import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/service";
import { isSupplyChainError } from "@/lib/supply-chain/service";

export function handleRouteError(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  if (isSupplyChainError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: "Unexpected server error.",
      code: "internal_error",
    },
    { status: 500 }
  );
}
