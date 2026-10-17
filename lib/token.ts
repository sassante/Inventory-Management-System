// Edge-safe (used by middleware): signs and verifies the login cookie.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "session";

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET is missing or too short. Set it in .env and in Vercel.");
  return new TextEncoder().encode(s);
}

export const sign = (uid: number) =>
  new SignJWT({ uid }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());

export async function verify(token?: string): Promise<number | null> {
  if (!token) return null;
  const k = key(); // throws loudly if the secret is missing
  try {
    const { payload } = await jwtVerify(token, k);
    return typeof payload.uid === "number" ? payload.uid : null;
  } catch {
    return null;
  }
}
