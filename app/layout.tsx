import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { getCurrentUser } from "@/lib/auth/service";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRS Control Tower",
  description:
    "Inventory and supply chain management system built with Next.js, Neon Postgres, and Drizzle ORM.",
  applicationName: "SRS Control Tower",
  authors: [{ name: "Avni Singhal" }],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        <SiteHeader viewer={viewer} />
        {children}
      </body>
    </html>
  );
}
