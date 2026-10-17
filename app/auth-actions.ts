"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { check, endSession, hash, requireAdmin, startSession } from "@/lib/auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (key: "error" | "ok", msg: string): never => redirect(`/users?${key}=${encodeURIComponent(msg)}`);

export async function login(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || !(await check(password, user.passwordHash))) {
    redirect(`/login?error=${encodeURIComponent("Incorrect email or password.")}`);
  }
  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function createUser(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role") === "ADMIN" ? "ADMIN" : "STAFF";

  if (!name || !email.includes("@")) back("error", "Enter a name and a valid email.");
  if (password.length < 8) back("error", "Password must be at least 8 characters.");
  try {
    await prisma.user.create({ data: { name, email, role: role as Role, passwordHash: await hash(password) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") back("error", `${email} already has an account.`);
    throw e;
  }
  revalidatePath("/users");
  back("ok", `Account created for ${name}`);
}

export async function deleteUser(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(str(fd, "id"));
  if (id === me.id) back("error", "You can't delete your own account.");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  back("ok", "User removed");
}
