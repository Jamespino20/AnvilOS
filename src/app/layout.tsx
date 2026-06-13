/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Montserrat,
  Instrument_Sans,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const instrumentSansHeading = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
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
import { ServiceWorkerRegistration } from "@/components/service-worker";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans overflow-x-hidden",
        montserrat.variable,
        instrumentSansHeading.variable,
      )}
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
        className={`${inter.variable} ${jetbrainsMono.variable} font-inter antialiased overflow-x-hidden`}
      >
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
