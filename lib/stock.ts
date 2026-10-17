import type { MovementType } from "@prisma/client";
import { prisma } from "./prisma";

export class StockError extends Error {}

export type MovementInput = {
  productId: number;
  type: MovementType;
  /** IN/OUT: units moved. ADJUST: the counted quantity now on the shelf. */
  quantity: number;
  note?: string;
  createdBy?: string;
};

/**
 * Updates stock and logs the movement in ONE transaction.
 * Stored movement quantity is a signed delta, so quantity == sum(movements) always.
 */
export async function applyMovement({ productId, type, quantity, note, createdBy }: MovementInput) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new StockError("Quantity must be a whole number, 0 or more.");
  if (type !== "ADJUST" && quantity === 0) throw new StockError("Quantity must be at least 1.");

  return prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id: productId } });
    if (!p) throw new StockError("Product not found.");

    const delta = type === "IN" ? quantity : type === "OUT" ? -quantity : quantity - p.quantity;
    if (delta === 0) throw new StockError("That would not change the stock level.");
    if (p.quantity + delta < 0) throw new StockError(`Only ${p.quantity} in stock. You can't remove ${quantity}.`);

    // Guard against two people updating at the same moment.
    const res = await tx.product.updateMany({
      where: { id: productId, quantity: p.quantity },
      data: { quantity: { increment: delta } },
    });
    if (res.count === 0) throw new StockError("Stock changed while you were saving. Please try again.");

    return tx.stockMovement.create({ data: { productId, type, quantity: delta, note: note || null, createdBy: createdBy ?? null } });
  });
}
