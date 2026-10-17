// Business-logic tests. Runs against your DATABASE_URL (use your dev DB) and cleans up after itself.
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { applyMovement, StockError } from "../lib/stock";

const sumOf = async (productId: number) =>
  (await prisma.stockMovement.aggregate({ where: { productId }, _sum: { quantity: true } }))._sum.quantity ?? 0;
const qtyOf = async (id: number) => (await prisma.product.findUniqueOrThrow({ where: { id } })).quantity;

async function main() {
  const sku = `TEST-${Date.now()}`;
  const p = await prisma.product.create({
    data: { sku, name: "Test item", price: 1, category: { connectOrCreate: { where: { name: "__test__" }, create: { name: "__test__" } } } },
  });
  let passed = 0;
  const check = async (name: string, fn: () => Promise<void>) => { await fn(); passed++; console.log(`ok  ${name}`); };

  try {
    await check("stock in adds units", async () => {
      await applyMovement({ productId: p.id, type: "IN", quantity: 10 });
      assert.equal(await qtyOf(p.id), 10);
    });
    await check("stock out removes units", async () => {
      await applyMovement({ productId: p.id, type: "OUT", quantity: 3 });
      assert.equal(await qtyOf(p.id), 7);
    });
    await check("stock out below zero is rejected and nothing changes", async () => {
      await assert.rejects(applyMovement({ productId: p.id, type: "OUT", quantity: 50 }), StockError);
      assert.equal(await qtyOf(p.id), 7);
    });
    await check("adjust sets the counted quantity", async () => {
      await applyMovement({ productId: p.id, type: "ADJUST", quantity: 20 });
      assert.equal(await qtyOf(p.id), 20);
    });
    await check("invalid quantities are rejected", async () => {
      await assert.rejects(applyMovement({ productId: p.id, type: "IN", quantity: 0 }), StockError);
      await assert.rejects(applyMovement({ productId: p.id, type: "IN", quantity: 1.5 }), StockError);
      await assert.rejects(applyMovement({ productId: p.id, type: "IN", quantity: -2 }), StockError);
    });
    await check("quantity equals sum of movements", async () => {
      assert.equal(await sumOf(p.id), await qtyOf(p.id));
    });
  } finally {
    await prisma.product.delete({ where: { id: p.id } });
    await prisma.category.deleteMany({ where: { name: "__test__", products: { none: {} } } });
    await prisma.$disconnect();
  }
  console.log(`\n${passed} checks passed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
