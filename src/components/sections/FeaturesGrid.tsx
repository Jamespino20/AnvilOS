/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

import { RevealUp } from "./RevealUp";

const features = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
    title: "Precision Inventory",
    description:
      "Track stock across aisles with automated low-stock alerts and cycle count workflows.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
        />
      </svg>
    ),
    title: "High-Speed POS",
    description:
      "Process transactions, handle returns, and log damages in seconds with a focused interface.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Immutable Audit Logs",
    description:
      "Security-first tracking for every action. Know exactly who adjusted stock and when.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0a1 1 0 01-1 1H5a1 1 0 01-1-1m10 0h4a1 1 0 001-1V9a1 1 0 00-1-1h-4m-3 4h.01M9 13h.01"
        />
      </svg>
    ),
    title: "Supplier Sync",
    description:
      "Manage vendor relationships, generate POs, and receive shipment flows seamlessly.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 bg-background" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <RevealUp className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-primary mb-4 tracking-tight">
            Engineered for the Warehouse Floor
          </h2>
          <p className="text-muted-foreground text-lg">
            Core modules built to handle high-density data, rapid transactions,
            and unyielding accuracy.
          </p>
        </RevealUp>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <RevealUp key={f.title} delay={i * 100}>
              <div className="group relative bg-card border border-border rounded-sm p-6 transition-all duration-300 cursor-pointer overflow-hidden hover:border-safety-orange/30">
                {/* Snappy Border Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(253,118,26,0.05)_0%,transparent_100%)]"></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 bg-primary/5 rounded-sm flex items-center justify-center mb-6 text-primary group-hover:text-safety-orange group-hover:bg-safety-orange/10 transition-all duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {f.description}
                  </p>
                  <span className="text-xs font-bold text-safety-orange flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300 uppercase tracking-widest">
                    Manual <span className="text-lg">→</span>
                  </span>
                </div>
              </div>
            </RevealUp>
          ))}
        </div>
      </div>
    </section>
  );
}
