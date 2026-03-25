import type { Product } from "@/lib/supply-chain/types";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function ProductTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-500">
        No products yet. Use the form to register the first SKU.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-900/6 bg-slate-50/50">
            {["Product", "SKU / Category", "Organization", "Unit Price", "Reorder Point"].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.13em] text-slate-400 first:pl-6 last:pr-6"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900/5">
          {products.map((product) => (
            <tr key={product.id} className="transition-colors hover:bg-white/40">
              <td className="px-5 py-4 pl-6">
                <p className="text-sm font-semibold text-slate-900">{product.name}</p>
              </td>
              <td className="px-5 py-4">
                <p className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {product.sku}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{product.category}</p>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm text-slate-700">{product.organizationName}</p>
                <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-slate-400">
                  {product.organizationCode}
                </p>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {fmt.format(product.unitPrice)}
                </p>
              </td>
              <td className="px-5 py-4 pr-6">
                <p className="text-sm tabular-nums text-slate-700">
                  {product.reorderPoint.toLocaleString()} units
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
