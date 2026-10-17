import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { when, signed } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Movements({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "" } = await searchParams;
  const t = ["IN", "OUT", "ADJUST"].includes(type) ? (type as "IN" | "OUT" | "ADJUST") : undefined;
  const rows = await prisma.stockMovement.findMany({
    where: t ? { type: t } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: true },
  });

  return (
    <>
      <h1>Movements</h1>
      <div className="tabs">
        <Link href="/movements" className={!t ? "on" : ""}>All</Link>
        <Link href="/movements?type=IN" className={t === "IN" ? "on" : ""}>Stock in</Link>
        <Link href="/movements?type=OUT" className={t === "OUT" ? "on" : ""}>Stock out</Link>
        <Link href="/movements?type=ADJUST" className={t === "ADJUST" ? "on" : ""}>Adjustments</Link>
      </div>
      <section className="panel flush">
        <div className="scroll">
          <table>
            <thead><tr><th>When</th><th>Product</th><th>Type</th><th className="num">Change</th><th>Note</th><th>By</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>{when(m.createdAt)}</td>
                  <td><Link href={`/products/${m.productId}`}>{m.product.name}</Link><small>{m.product.sku}</small></td>
                  <td>{m.type}</td>
                  <td className={`num ${m.quantity < 0 ? "bad" : "good"}`}>{signed(m.quantity)}</td>
                  <td className="muted">{m.note}</td>
                  <td className="muted">{m.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="empty">No movements of this type yet.</p>}
      </section>
      <p className="muted">Showing the latest 100.</p>
    </>
  );
}
