// Usage: npx tsx scripts/create-admin.ts you@example.com "YourPassword" "Your Name"
// Creates the admin account (or resets its password if it already exists).
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, password, ...rest] = process.argv.slice(2);
  const name = rest.join(" ") || "Admin";
  if (!email || !password || password.length < 8) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password, 8+ chars> "Full Name"');
    process.exit(1);
  }
  const e = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email: e },
    update: { passwordHash, name, role: "ADMIN" },
    create: { email: e, name, passwordHash, role: "ADMIN" },
  });
  console.log(`Admin ready: ${e}`);
}

main().finally(() => prisma.$disconnect());
