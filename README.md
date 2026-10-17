# Stockroom – Inventory Management System

Next.js (App Router) + PostgreSQL (Neon) + Prisma, deployable on Vercel.

**Features:** product CRUD, stock in / out / adjust with a full movement log, search (name or SKU), filter (category, stock status) and sort, a reports dashboard (reorder list, stock value, value by category, recent movements), CSV export.

## Run locally

```bash
npm install
cp .env.example .env        # then paste your Neon connection string(s) into .env
npx prisma migrate dev --name init
npm run db:seed             # 24 sample products
npm run dev                 # http://localhost:3000
```

Use a separate Neon branch/database for local work so testing doesn't touch production data.

## Test data accuracy

```bash
npm test         # business-logic tests (stock in/out/adjust, negative-stock rejection)
npm run verify   # checks product.quantity == sum of its movements for every product
```

## Deploy

1. Push to GitHub (`.env` is git-ignored; commit `prisma/migrations/`).
2. Vercel: **Add New > Project**, import the repo.
3. Environment variables: `DATABASE_URL` and `DIRECT_URL` (same Neon string in both is fine), optional `NEXT_PUBLIC_CURRENCY` (e.g. `GHS`).
   If you added Neon through Vercel Storage, `DATABASE_URL` is added for you; set `DIRECT_URL` to the value of `DATABASE_URL_UNPOOLED`.
4. Leave the Build Command on default. The `vercel-build` script runs `prisma generate && prisma migrate deploy && next build`.
5. Seed production once from your machine if you want sample data: put the production string in `.env` temporarily and run `npm run db:seed`. **The seed script deletes existing data**, so don't re-run it on real data.

## How stock accuracy works

- Every change goes through `lib/stock.ts`, which updates the product and writes a `StockMovement` row in one transaction.
- Movement quantities are signed (IN `+n`, OUT `-n`, ADJUST `counted - previous`), so quantity always equals the sum of movements.
- OUT movements that would drop stock below zero are rejected, and simultaneous edits are detected and retried.

## Structure

```
prisma/schema.prisma   Category, Product, StockMovement
prisma/seed.ts         sample data
lib/stock.ts           stock business logic
app/actions.ts         server actions (create/update/delete/move stock)
app/page.tsx           reports dashboard
app/products/*         list + filters, create, detail + stock form + history
app/movements          movement log
scripts/               verify + tests
```
