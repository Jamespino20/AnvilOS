/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RevealUp } from "./RevealUp";

const faqs = [
  {
    q: "Does AnvilOS work without an internet connection?",
    a: "Yes. The POS terminal operates fully offline. Transactions queue locally and sync when the connection is restored. Inventory counts are updated accordingly.",
  },
  {
    q: "How is my data backed up?",
    a: "Data is encrypted at rest and during sync. We maintain redundant cloud backups with point-in-time recovery, plus the option for local database exports on your server.",
  },
  {
    q: "Can I integrate AnvilOS with my existing accounting software?",
    a: "Our Enterprise tier includes custom API integrations. The Pro and Starter tiers support CSV/Excel exports that can be imported into QuickBooks, Xero, and other tools.",
  },
  {
    q: "How long does it take to deploy?",
    a: "Most single-location stores are fully set up in under 2 days — including product catalog import, register configuration, and staff training.",
  },
  {
    q: "What hardware do I need for the POS?",
    a: "AnvilOS runs on any modern web browser. For the best experience, we recommend a tablet or laptop with a barcode scanner and receipt printer.",
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-24 bg-card border-y border-border" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <RevealUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-primary mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Quick answers to common questions about deploying and using AnvilOS.
          </p>
        </RevealUp>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <RevealUp
              key={i}
              delay={i * 50}
              className="border border-border rounded-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left bg-card hover:bg-muted/50 transition-colors duration-200 group"
              >
                <span className="text-sm font-bold text-primary pr-4 group-hover:text-accent transition-colors">
                  {faq.q}
                </span>
                <motion.svg
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-4 h-4 flex-shrink-0 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </RevealUp>
          ))}
        </div>
      </div>
    </section>
  );
}
