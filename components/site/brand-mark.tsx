import { ShipWheel } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
        <ShipWheel className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-semibold tracking-tight text-slate-900">
          Supply Chain Control Tower
        </p>
      </div>
    </div>
  );
}
