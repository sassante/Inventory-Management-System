import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { moveStock, updateProduct, deleteProduct } from "@/app/actions";
import { money, when, signed, stockStatus, statusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> };

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const [p, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: pid },
      include: { category: true, movements: { orderBy: { createdAt: "desc" }, take: 50 } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!p) notFound();
  const s = stockStatus(p.quantity, p.reorderLevel);

  return (
    <>
      <p className="muted"><Link href="/products">Products</Link> / {p.sku}</p>
      <div className="head">
        <h1>{p.name}</h1>
        <span className={`badge ${s}`}>{statusLabel[s]}</span>
      </div>
      <p className="muted">{p.quantity} on hand, {money(p.price)} each, worth {money(Number(p.price) * p.quantity)}. Reorder at {p.reorderLevel}.</p>
      {error && <div className="banner err">{error}</div>}
      {ok && <div className="banner ok">{ok}</div>}

      <div className="cols">
        <form action={moveStock} className="panel form">
          <h2>Update stock</h2>
          <input type="hidden" name="productId" value={p.id} />
          <label>Action
            <select name="type" defaultValue="IN">
              <option value="IN">Stock in (received)</option>
              <option value="OUT">Stock out (sold or used)</option>
              <option value="ADJUST">Adjust (set to counted quantity)</option>
            </select>
          </label>
          <label>Quantity<input name="quantity" type="number" min="0" step="1" required /></label>
          <label>Note<input name="note" placeholder="Optional, e.g. supplier delivery" /></label>
          <button className="btn">Save stock update</button>
        </form>

        <form action={updateProduct} className="panel form">
          <h2>Details</h2>
          <input type="hidden" name="id" value={p.id} />
          <label>Name<input name="name" defaultValue={p.name} required /></label>
          <label>Category
            <input name="category" defaultValue={p.category.name} required list="cats" />
            <datalist id="cats">{categories.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          </label>
          <label>Price<input name="price" type="number" step="0.01" min="0" defaultValue={Number(p.price)} required /></label>
          <label>Reorder level<input name="reorderLevel" type="number" min="0" step="1" defaultValue={p.reorderLevel} required /></label>
          <button className="btn ghost">Save details</button>
        </form>
      </div>

      <section className="panel">
        <h2>Stock history</h2>
        {p.movements.length === 0 ? <p className="muted">No movements recorded.</p> : (
          <table>
            <thead><tr><th>When</th><th>Type</th><th className="num">Change</th><th>Note</th></tr></thead>
            <tbody>
              {p.movements.map((m) => (
                <tr key={m.id}>
                  <td>{when(m.createdAt)}</td>
                  <td>{m.type}</td>
                  <td className={`num ${m.quantity < 0 ? "bad" : "good"}`}>{signed(m.quantity)}</td>
                  <td className="muted">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <details className="danger">
        <summary>Delete this product</summary>
        <p>This also deletes its stock history and can't be undone.</p>
        <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="btn danger-btn">Delete product</button></form>
      </details>
    </>
  );
}
