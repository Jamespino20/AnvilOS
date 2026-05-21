import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Montserrat, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const instrumentSansHeading = Instrument_Sans({subsets:['latin'],variable:'--font-heading'});

const montserrat = Montserrat({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "AnvilOS — Hardware Management Platform",
  description: "Point-of-sale, inventory, and supplier management for hardware businesses.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", montserrat.variable, instrumentSansHeading.variable)}>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-inter antialiased`}>
        {children}
      </body>
    </html>
  );
}
