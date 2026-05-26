/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { RevealUp } from "@/components/sections/RevealUp";

function Content() {
  return (
    <div className="pt-24">
      <section className="py-20 bg-industrial-blue relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-safety-orange/10 via-industrial-blue to-cyan-900/20" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <RevealUp>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Everything You Need to <br />
              <span className="text-safety-orange">
                Run Your Hardware Store
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              From point-of-sale to inventory management, supplier sync to audit
              trails — CWL Hardware is the complete operating system for
              hardware and industrial supply businesses.
            </p>
          </RevealUp>
        </div>
      </section>
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Point-of-Sale",
                icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
                desc: "Fast, offline-capable POS terminal with support for walk-in sales, purchase orders, returns, damages, and adjustments.",
              },
              {
                title: "Inventory Management",
                icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
                desc: "Real-time stock tracking with low-stock alerts, category hierarchy, supplier linking, and photo support.",
              },
              {
                title: "Restock & Replenishment",
                icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
                desc: "Streamlined restock workflow with POS-style cart. Process stock additions with one click and maintain a complete audit trail.",
              },
              {
                title: "Customer Management",
                icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
                desc: "Maintain a searchable customer database with purchase history, contact details, and addresses.",
              },
              {
                title: "Supplier Sync",
                icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0a1 1 0 01-1 1H5a1 1 0 01-1-1m10 0h4a1 1 0 001-1V9a1 1 0 00-1-1h-4m-3 4h.01M9 13h.01",
                desc: "Manage vendor profiles, track product sourcing, and generate purchase orders from one place.",
              },
              {
                title: "Audit & Compliance",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                desc: "Immutable audit logs track every stock adjustment, transaction, and configuration change with before/after values.",
              },
            ].map((s, i) => (
              <RevealUp key={s.title} delay={i * 80}>
                <div className="bg-card border border-border rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center mb-6 text-primary group-hover:text-safety-orange group-hover:bg-safety-orange/10 transition-all">
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
                        d={s.icon}
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </RevealUp>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted border-y border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <RevealUp>
            <h2 className="text-3xl md:text-4xl font-black text-primary mb-4 tracking-tight">
              Ready to See It in Action?
            </h2>
            <p className="text-muted-foreground mb-8">
              Schedule a personalized demo with our team and discover how CWL
              Hardware can transform your operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-3.5 bg-safety-orange text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-lg shadow-safety-orange/20 text-center cursor-pointer"
              >
                Request Demo
              </a>
              <a
                href="/register"
                className="px-8 py-3.5 border border-border text-primary text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-muted transition-all text-center cursor-pointer"
              >
                Start Free Trial
              </a>
            </div>
          </RevealUp>
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Content />
      </main>
      <Footer />
    </>
  );
}
