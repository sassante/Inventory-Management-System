import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money, when, signed } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [products, recent] = await Promise.all([
    prisma.product.findMany({ include: { category: true } }),
    prisma.stockMovement.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { product: true } }),
  ]);

  const value = products.reduce((s, p) => s + Number(p.price) * p.quantity, 0);
  const units = products.reduce((s, p) => s + p.quantity, 0);
  const out = products.filter((p) => p.quantity === 0).length;
  const low = products
    .filter((p) => p.quantity <= p.reorderLevel)
    .sort((a, b) => a.quantity - a.reorderLevel - (b.quantity - b.reorderLevel));

  const cats = new Map<string, { value: number; units: number }>();
  for (const p of products) {
    const c = cats.get(p.category.name) ?? { value: 0, units: 0 };
    c.value += Number(p.price) * p.quantity;
    c.units += p.quantity;
    cats.set(p.category.name, c);
  }
  const byCat = [...cats.entries()].sort((a, b) => b[1].value - a[1].value);
  const max = Math.max(1, ...byCat.map(([, c]) => c.value));

  return (
    <>
      <h1>{low.length ? `${low.length} product${low.length > 1 ? "s" : ""} need reordering` : "Stock levels look healthy"}</h1>
      <p className="muted">{products.length} products, {units.toLocaleString()} units on hand, worth {money(value)}.</p>

      <div className="stats">
        <div><span>Products</span><b>{products.length}</b></div>
        <div><span>Units on hand</span><b>{units.toLocaleString()}</b></div>
        <div><span>Stock value</span><b>{money(value)}</b></div>
        <div><span>Out of stock</span><b className={out ? "bad" : ""}>{out}</b></div>
      </div>

      <div className="cols">
        <section className="panel">
          <h2>Reorder list</h2>
          {low.length === 0 ? <p className="muted">Nothing is at or below its reorder level.</p> : (
            <table>
              <thead><tr><th>Product</th><th className="num">On hand</th><th className="num">Reorder at</th></tr></thead>
              <tbody>
                {low.slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/products/${p.id}`}>{p.name}</Link><small>{p.sku}</small></td>
                    <td className={`num ${p.quantity === 0 ? "bad" : "warn"}`}>{p.quantity}</td>
                    <td className="num">{p.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {low.length > 10 && <p className="muted"><Link href="/products?status=low">See all {low.length} low-stock products</Link></p>}
        </section>

        <section className="panel">
          <h2>Stock value by category</h2>
          {byCat.length === 0 && <p className="muted">Add products to see this chart.</p>}
          <div className="bars">
            {byCat.map(([name, c]) => (
              <div key={name} className="bar">
                <div className="bar-head"><span>{name}</span><span>{money(c.value)}</span></div>
                <div className="track"><div className="fill" style={{ width: `${(c.value / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Recent movements</h2>
        {recent.length === 0 ? <p className="muted">No movements yet.</p> : (
          <table>
            <thead><tr><th>When</th><th>Product</th><th>Type</th><th className="num">Change</th><th>Note</th></tr></thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td>{when(m.createdAt)}</td>
                  <td><Link href={`/products/${m.productId}`}>{m.product.name}</Link></td>
                  <td>{m.type}</td>
                  <td className={`num ${m.quantity < 0 ? "bad" : "good"}`}>{signed(m.quantity)}</td>
                  <td className="muted">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
