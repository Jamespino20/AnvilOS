/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

"use client";

import { motion } from "framer-motion";
import { RevealUp } from "./RevealUp";

const benefits = [
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    ),
    title: "Built for Resilience",
    description:
      "Offline mode ensures you never stop selling, even when the internet goes down. Transactions sync automatically upon reconnection.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    ),
    title: "Data Integrity at Core",
    description:
      "Every byte is backed up with enterprise-grade encryption and redundancy, ensuring your inventory counts are always accurate.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Edge-First Performance",
    description:
      "Lightning-fast barcode scanning and checkout times, processing thousands of SKUs without breaking a sweat.",
  },
];

export function WhyChooseUs() {
  return (
    <section
      className="py-16 bg-card border-y border-border overflow-hidden"
      id="why-choose-us"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <RevealUp>
              <h2 className="text-4xl md:text-5xl font-black text-primary mb-6 tracking-tight">
                Built for the Toughest Retail Environments.
              </h2>
              <p className="text-lg text-primary/70 mb-8 leading-relaxed">
                We didn&apos;t just build a POS; we built a fortress for your
                data. CWL Hardware is designed to withstand network drops,
                massive inventory catalogs, and the rigorous demands of a busy
                hardware store.
              </p>
            </RevealUp>
            <div className="space-y-6">
              {benefits.map((b, i) => (
                <RevealUp key={b.title} delay={i * 100}>
                  <motion.div
                    className="flex gap-4 group cursor-pointer"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      {b.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-primary mb-1">
                        {b.title}
                      </h4>
                      <p className="text-sm text-primary/70">{b.description}</p>
                    </div>
                  </motion.div>
                </RevealUp>
              ))}
            </div>
          </div>
          <RevealUp delay={200} className="flex-1 w-full relative">
            <div className="aspect-square md:aspect-video lg:aspect-square bg-[#0a151b] rounded-sm overflow-hidden border border-white/5 relative group shadow-2xl">
              {/* Blueprint Grid */}
              <div
                className="absolute inset-0 opacity-[0.1]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "100px 100px",
                }}
              ></div>

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(253,118,26,0.03)_0%,transparent_70%)]" />
              <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
                <div className="text-white/20 font-black text-6xl tracking-tighter italic opacity-50 select-none">
                  CWL<span className="text-safety-orange/40">HARDWARE</span>
                </div>
                <div className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] mt-4">
                  System Architecture v1.0
                </div>
              </div>

              {/* Scanner Line Effect */}
              <motion.div
                className="absolute top-0 left-0 w-full h-[1px] bg-safety-orange/20 z-20"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </RevealUp>
        </div>
      </div>
    </section>
  );
}
