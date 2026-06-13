/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import type { Metadata } from "next";
import { JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CWL Hardware — POS & Inventory System",
  description:
    "Complete point-of-sale, inventory, and supplier management system by CWL Hardware.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", montserrat.variable)}
      style={{ overflowX: "clip" }}
    >
      <head>
        <meta
          httpEquiv="cache-control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="pragma" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
      </head>
      <body
        className={`${jetbrainsMono.variable} antialiased`}
        style={{ overflowX: "clip" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
