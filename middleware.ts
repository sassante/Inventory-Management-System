import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verify } from "@/lib/token";

// Everything except /login requires a valid session cookie.
export async function middleware(req: NextRequest) {
  const uid = await verify(req.cookies.get(COOKIE)?.value);
  if (!uid && req.nextUrl.pathname !== "/login") return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
