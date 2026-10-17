import type { Metadata } from "next";
import Link from "next/link";
import { Archivo } from "next/font/google";
import { currentUser } from "@/lib/auth";
import { logout } from "@/app/auth-actions";
import "./globals.css";

const font = Archivo({ subsets: ["latin"], variable: "--font" });

export const metadata: Metadata = { title: "Stockroom – Inventory Management", description: "Track products, stock levels and movements." };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en" className={font.variable}>
      <body>
        {!user ? children : (
          <div className="shell">
            <aside className="side">
              <Link href="/" className="brand">Stockroom</Link>
              <nav>
                <Link href="/">Dashboard</Link>
                <Link href="/products">Products</Link>
                <Link href="/movements">Movements</Link>
                <a href="/api/export">Export CSV</a>
                {user.role === "ADMIN" && <Link href="/users">Users</Link>}
              </nav>
              <Link href="/products/new" className="btn side-cta">Add product</Link>
              <div className="who">
                <b>{user.name}</b>
                <span>{user.role === "ADMIN" ? "Admin" : "Staff"}</span>
                <form action={logout}><button className="linkbtn">Sign out</button></form>
              </div>
            </aside>
            <main className="main">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
