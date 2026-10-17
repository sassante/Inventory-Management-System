const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";

export const money = (n: number | string | { toString(): string }) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(n));

export const when = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

export type Status = "ok" | "low" | "out";
export const stockStatus = (qty: number, reorder: number): Status => (qty === 0 ? "out" : qty <= reorder ? "low" : "ok");
export const statusLabel: Record<Status, string> = { ok: "In stock", low: "Low stock", out: "Out of stock" };
export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
