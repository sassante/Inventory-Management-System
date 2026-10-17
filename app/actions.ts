"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyMovement, StockError } from "@/lib/stock";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(str(f, k));
const go = (path: string, key: "error" | "ok", msg: string): never => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);
const refresh = () => revalidatePath("/", "layout");

function validate(price: number, reorderLevel: number) {
  if (!(price >= 0)) return "Price must be a number, 0 or more.";
  if (!Number.isInteger(reorderLevel) || reorderLevel < 0) return "Reorder level must be a whole number, 0 or more.";
  return null;
}

export async function createProduct(fd: FormData) {
  const sku = str(fd, "sku").toUpperCase();
  const name = str(fd, "name");
  const category = str(fd, "category");
  const price = num(fd, "price");
  const quantity = num(fd, "quantity");
  const reorderLevel = num(fd, "reorderLevel");

  if (!sku || !name || !category) go("/products/new", "error", "SKU, name and category are required.");
  const bad = validate(price, reorderLevel);
  if (bad) go("/products/new", "error", bad);
  if (!Number.isInteger(quantity) || quantity < 0) go("/products/new", "error", "Starting quantity must be a whole number, 0 or more.");

  let id = 0;
  try {
    const p = await prisma.product.create({
      data: {
        sku, name, price, quantity, reorderLevel,
        category: { connectOrCreate: { where: { name: category }, create: { name: category } } },
        movements: quantity > 0 ? { create: { type: "IN", quantity, note: "Initial stock" } } : undefined,
      },
    });
    id = p.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") go("/products/new", "error", `SKU ${sku} already exists.`);
    throw e;
  }
  refresh();
  redirect(`/products/${id}?ok=${encodeURIComponent("Product created")}`);
}

export async function updateProduct(fd: FormData) {
  const id = num(fd, "id");
  const path = `/products/${id}`;
  const name = str(fd, "name");
  const category = str(fd, "category");
  const price = num(fd, "price");
  const reorderLevel = num(fd, "reorderLevel");

  if (!name || !category) go(path, "error", "Name and category are required.");
  const bad = validate(price, reorderLevel);
  if (bad) go(path, "error", bad);

  await prisma.product.update({
    where: { id },
    data: { name, price, reorderLevel, category: { connectOrCreate: { where: { name: category }, create: { name: category } } } },
  });
  refresh();
  go(path, "ok", "Details saved");
}

export async function moveStock(fd: FormData) {
  const productId = num(fd, "productId");
  const path = `/products/${productId}`;
  try {
    await applyMovement({
      productId,
      type: str(fd, "type") as MovementType,
      quantity: num(fd, "quantity"),
      note: str(fd, "note") || undefined,
    });
  } catch (e) {
    if (e instanceof StockError) go(path, "error", e.message);
    throw e;
  }
  refresh();
  go(path, "ok", "Stock updated");
}

export async function deleteProduct(fd: FormData) {
  await prisma.product.delete({ where: { id: num(fd, "id") } });
  refresh();
  redirect("/products");
}
