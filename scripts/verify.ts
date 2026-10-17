// Data accuracy check: every product's quantity must equal the sum of its movements.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [products, sums] = await Promise.all([
    prisma.product.findMany({ select: { id: true, sku: true, quantity: true } }),
    prisma.stockMovement.groupBy({ by: ["productId"], _sum: { quantity: true } }),
  ]);
  const sumById = new Map(sums.map((s) => [s.productId, s._sum.quantity ?? 0]));

  const bad = products.filter((p) => (sumById.get(p.id) ?? 0) !== p.quantity);
  const negative = products.filter((p) => p.quantity < 0);

  bad.forEach((p) => console.log(`MISMATCH ${p.sku}: quantity=${p.quantity}, movements=${sumById.get(p.id) ?? 0}`));
  negative.forEach((p) => console.log(`NEGATIVE ${p.sku}: ${p.quantity}`));
  console.log(`Checked ${products.length} products: ${bad.length} mismatches, ${negative.length} negative.`);
  process.exitCode = bad.length || negative.length ? 1 : 0;
}

main().finally(() => prisma.$disconnect());
