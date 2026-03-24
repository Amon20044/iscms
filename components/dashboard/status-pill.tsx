import type { CarrierStatus, OrderState, Priority } from "@/lib/supply-chain/types";

const orderStateClasses: Record<OrderState, string> = {
  created: "border-[#c66a3d]/30 bg-[#fff3e6] text-[#8b4d2d]",
  assigned: "border-[#2f5f8f]/25 bg-[#edf4ff] text-[#24476b]",
  in_transit: "border-[#2a7a74]/25 bg-[#e7faf7] text-[#16514d]",
  delayed: "border-[#cb5e4a]/30 bg-[#fff0eb] text-[#8f3e31]",
  reassigned: "border-[#b78a2c]/28 bg-[#fff8df] text-[#7a5c17]",
  delivered: "border-[#4f7d3f]/25 bg-[#f0faea] text-[#3d5e31]",
};

const carrierStatusClasses: Record<CarrierStatus, string> = {
  active: "border-[#2a7a74]/25 bg-[#e7faf7] text-[#16514d]",
  degraded: "border-[#cb5e4a]/30 bg-[#fff0eb] text-[#8f3e31]",
  offline: "border-[#4c5665]/25 bg-[#eff1f5] text-[#2b3443]",
};

const priorityClasses: Record<Priority, string> = {
  standard: "border-[#4c5665]/25 bg-[#eff1f5] text-[#2b3443]",
  express: "border-[#2f5f8f]/25 bg-[#edf4ff] text-[#24476b]",
  critical: "border-[#cb5e4a]/30 bg-[#fff0eb] text-[#8f3e31]",
};

export function formatTokenLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${className}`}
    >
      {label}
    </span>
  );
}

export function OrderStatePill({ state }: { state: OrderState }) {
  return <Pill label={formatTokenLabel(state)} className={orderStateClasses[state]} />;
}

export function CarrierStatusPill({ status }: { status: CarrierStatus }) {
  return <Pill label={formatTokenLabel(status)} className={carrierStatusClasses[status]} />;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return <Pill label={formatTokenLabel(priority)} className={priorityClasses[priority]} />;
}
