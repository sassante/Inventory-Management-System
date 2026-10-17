import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { COOKIE, sign, verify } from "./token";

export const hash = (pw: string) => bcrypt.hash(pw, 10);
export const check = (pw: string, h: string) => bcrypt.compare(pw, h);

// Always reads the user from the database, so deleted users and role changes take effect immediately.
export const currentUser = cache(async () => {
  const uid = await verify((await cookies()).get(COOKIE)?.value);
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid }, select: { id: true, email: true, name: true, role: true } });
});

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/");
  return u;
}

export async function startSession(uid: number) {
  (await cookies()).set(COOKIE, await sign(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}
