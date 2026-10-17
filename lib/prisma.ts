import { PrismaClient } from "@prisma/client";

// One shared client so hot reloads / serverless invocations don't open extra connections.
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
