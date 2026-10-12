import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Food Supply Chain & Waste Reduction System",
  description:
    "A smart, traceable platform connecting food providers, NGOs and distributors to reduce food waste and deliver surplus food safely to communities in need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 min-h-screen text-slate-900 font-sans">{children}</body>
    </html>
  );
}