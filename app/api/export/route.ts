import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } });
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    "SKU,Name,Category,Price,Quantity,Reorder level,Stock value",
    ...rows.map((p) =>
      [p.sku, p.name, p.category.name, p.price, p.quantity, p.reorderLevel, (Number(p.price) * p.quantity).toFixed(2)].map(esc).join(",")
    ),
  ].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="inventory.csv"' },
  });
}
