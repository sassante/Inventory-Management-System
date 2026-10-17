import type { Metadata } from "next";
import Link from "next/link";
import { Archivo } from "next/font/google";
import "./globals.css";

const font = Archivo({ subsets: ["latin"], variable: "--font" });

export const metadata: Metadata = { title: "Stockroom – Inventory Management", description: "Track products, stock levels and movements." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <div className="shell">
          <aside className="side">
            <Link href="/" className="brand">Stockroom</Link>
            <nav>
              <Link href="/">Dashboard</Link>
              <Link href="/products">Products</Link>
              <Link href="/movements">Movements</Link>
              <a href="/api/export">Export CSV</a>
            </nav>
            <Link href="/products/new" className="btn side-cta">Add product</Link>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
