import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { money, stockStatus, statusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; category?: string; status?: string; sort?: string; dir?: string }>;

export default async function Products({ searchParams }: { searchParams: SP }) {
  const { q = "", category = "", status = "", sort = "name", dir = "asc" } = await searchParams;
  const sortKey = ["name", "sku", "price", "quantity", "updatedAt"].includes(sort) ? sort : "name";
  const direction = dir === "desc" ? "desc" : "asc";
  const catId = Number.isInteger(Number(category)) && category ? Number(category) : null;

  const [categories, rows] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: {
        ...(catId ? { categoryId: catId } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}),
      },
      include: { category: true },
      orderBy: { [sortKey]: direction } as Prisma.ProductOrderByWithRelationInput,
    }),
  ]);
  // Low/out status compares two columns, so it's filtered here rather than in SQL.
  const list = status ? rows.filter((p) => stockStatus(p.quantity, p.reorderLevel) === status) : rows;

  return (
    <>
      <div className="head"><h1>Products</h1><Link href="/products/new" className="btn">Add product</Link></div>

      <form className="filters" method="get">
        <input name="q" defaultValue={q} placeholder="Search by name or SKU" />
        <select name="category" defaultValue={category}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status}>
          <option value="">Any stock level</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select name="sort" defaultValue={sortKey}>
          <option value="name">Sort by name</option>
          <option value="sku">Sort by SKU</option>
          <option value="price">Sort by price</option>
          <option value="quantity">Sort by quantity</option>
          <option value="updatedAt">Sort by last updated</option>
        </select>
        <select name="dir" defaultValue={direction}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button className="btn">Apply</button>
        <Link href="/products" className="btn ghost">Clear</Link>
      </form>

      <section className="panel flush">
        <div className="scroll">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">On hand</th><th className="num">Reorder at</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((p) => {
                const s = stockStatus(p.quantity, p.reorderLevel);
                return (
                  <tr key={p.id}>
                    <td><Link href={`/products/${p.id}`}>{p.name}</Link><small>{p.sku}</small></td>
                    <td>{p.category.name}</td>
                    <td className="num">{money(p.price)}</td>
                    <td className="num">{p.quantity}</td>
                    <td className="num">{p.reorderLevel}</td>
                    <td><span className={`badge ${s}`}>{statusLabel[s]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <p className="empty">No products match these filters. Clear them or add a product.</p>}
      </section>
      <p className="muted">{list.length} of {rows.length} products shown.</p>
    </>
  );
}
