import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [sku, name, category, price, quantity on hand, reorder level]
const items: [string, string, string, number, number, number][] = [
  ["ELEC-001", "USB-C Charging Cable 1m", "Electronics", 6.5, 120, 40],
  ["ELEC-002", "Wireless Mouse", "Electronics", 14.99, 8, 15],
  ["ELEC-003", "Bluetooth Speaker", "Electronics", 39.0, 22, 10],
  ["ELEC-004", "Power Bank 10000mAh", "Electronics", 24.5, 0, 12],
  ["ELEC-005", "HDMI Cable 2m", "Electronics", 8.75, 64, 20],
  ["ELEC-006", "Laptop Stand", "Electronics", 27.0, 14, 8],
  ["OFF-001", "A4 Copy Paper (ream)", "Office Supplies", 4.2, 240, 100],
  ["OFF-002", "Ballpoint Pens (box of 50)", "Office Supplies", 9.0, 18, 20],
  ["OFF-003", "Stapler", "Office Supplies", 7.25, 31, 10],
  ["OFF-004", "Sticky Notes (12 pack)", "Office Supplies", 5.5, 9, 25],
  ["OFF-005", "Whiteboard Markers (4 pack)", "Office Supplies", 6.0, 47, 15],
  ["FUR-001", "Ergonomic Office Chair", "Furniture", 129.0, 12, 5],
  ["FUR-002", "Standing Desk", "Furniture", 289.0, 4, 5],
  ["FUR-003", "Filing Cabinet", "Furniture", 98.0, 7, 4],
  ["FUR-004", "Bookshelf", "Furniture", 74.5, 0, 3],
  ["CLN-001", "Hand Sanitizer 500ml", "Cleaning", 4.8, 85, 30],
  ["CLN-002", "Disinfectant Wipes", "Cleaning", 3.9, 26, 30],
  ["CLN-003", "Trash Bags (roll of 30)", "Cleaning", 2.75, 150, 50],
  ["CLN-004", "Floor Cleaner 1L", "Cleaning", 5.2, 40, 15],
  ["KIT-001", "Instant Coffee 200g", "Kitchen", 7.8, 33, 12],
  ["KIT-002", "Sugar 1kg", "Kitchen", 1.9, 6, 15],
  ["KIT-003", "Paper Cups (pack of 100)", "Kitchen", 3.4, 72, 25],
  ["KIT-004", "Electric Kettle", "Kitchen", 22.0, 11, 6],
  ["KIT-005", "Tea Bags (box of 100)", "Kitchen", 3.1, 58, 20],
];

async function main() {
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const day = 86_400_000;
  for (const [i, [sku, name, category, price, qty, reorderLevel]] of items.entries()) {
    const sold = (i % 7) + 2;
    const received = new Date(Date.now() - (30 + i) * day);
    const soldAt = new Date(Date.now() - (i % 10) * day - i * 3_600_000);
    // IN (+qty+sold) then OUT (-sold) so quantity == sum(movements)
    await prisma.product.create({
      data: {
        sku, name, price, quantity: qty, reorderLevel,
        category: { connectOrCreate: { where: { name: category }, create: { name: category } } },
        movements: {
          create: [
            { type: "IN", quantity: qty + sold, note: "Initial stock", createdAt: received },
            { type: "OUT", quantity: -sold, note: "Sales", createdAt: soldAt },
          ],
        },
      },
    });
  }
  console.log(`Seeded ${items.length} products.`);
}

main().finally(() => prisma.$disconnect());
