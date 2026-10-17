import { prisma } from "@/lib/prisma";
import { createProduct } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <h1>Add product</h1>
      {error && <div className="banner err">{error}</div>}
      <form action={createProduct} className="panel form">
        <label>SKU<input name="sku" required placeholder="e.g. ELEC-0042" /></label>
        <label>Name<input name="name" required /></label>
        <label>Category
          <input name="category" required list="cats" placeholder="Pick one or type a new category" />
          <datalist id="cats">{categories.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        </label>
        <label>Price<input name="price" type="number" step="0.01" min="0" required /></label>
        <label>Starting quantity<input name="quantity" type="number" min="0" step="1" defaultValue={0} /></label>
        <label>Reorder level<input name="reorderLevel" type="number" min="0" step="1" defaultValue={10} /></label>
        <button className="btn">Create product</button>
      </form>
    </>
  );
}
