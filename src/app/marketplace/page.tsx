/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { RevealUp } from "@/components/sections/RevealUp";

const categories = [
  { name: "Power Tools", count: "1,200+", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  {
    name: "Hand Tools",
    count: "3,400+",
    icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m0 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
  },
  {
    name: "Safety Equipment",
    count: "800+",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    name: "Plumbing",
    count: "2,100+",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  },
  { name: "Electrical", count: "1,800+", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  {
    name: "Building Materials",
    count: "4,500+",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
];

function Content() {
  return (
    <div className="pt-24">
      <section className="py-20 bg-industrial-blue relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-safety-orange/10 via-industrial-blue to-cyan-900/20" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <RevealUp>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Source. Stock. <span className="text-safety-orange">Sell.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Connect with verified suppliers, browse millions of SKUs, and
              streamline your procurement â€” all from within CWL Hardware.
            </p>
          </RevealUp>
        </div>
      </section>
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <RevealUp className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary mb-4 tracking-tight">
              Browse by Category
            </h2>
            <p className="text-muted-foreground text-lg">
              Find exactly what you need across our extensive product catalog.
            </p>
          </RevealUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((c, i) => (
              <RevealUp key={c.name} delay={i * 80}>
                <div className="bg-card border border-border rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center group-hover:bg-safety-orange/10 transition-colors">
                      <svg
                        className="w-5 h-5 text-muted-foreground group-hover:text-safety-orange transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d={c.icon}
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-primary">{c.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-primary">{c.count}</span>{" "}
                    products available
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
            <h2 className="text-3xl font-black text-primary mb-4 tracking-tight">
              Want to Become a Supplier?
            </h2>
            <p className="text-muted-foreground mb-8">
              List your products on CWL Hardware Marketplace and reach hundreds
              of hardware stores.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3.5 bg-safety-orange text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-lg shadow-safety-orange/20 cursor-pointer"
            >
              Apply Now
            </a>
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




