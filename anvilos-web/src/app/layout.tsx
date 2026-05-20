import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AnvilOS — Hardware Management Platform",
  description:
    "Point-of-sale, inventory, and supplier management for hardware businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
