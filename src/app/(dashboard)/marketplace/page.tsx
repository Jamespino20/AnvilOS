/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";

export default function MarketplacePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-safety-orange/10 text-safety-orange text-xs font-bold uppercase tracking-widest mb-6">
            Module Under Construction
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-primary mb-6 tracking-tighter">
            INDUSTRIAL <span className="text-safety-orange">MARKETPLACE</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            The AnvilOS Marketplace is currently being engineered to provide a
            seamless ecosystem for hardware suppliers and retailers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                title: "Supplier Hub",
                desc: "Direct access to top-tier hardware manufacturers.",
              },
              {
                title: "Bulk Procurement",
                desc: "Automated bidding and volume discount flows.",
              },
              {
                title: "Integrated Logistics",
                desc: "Real-time tracking for heavy-duty freight.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 bg-card border border-border rounded-sm"
              >
                <h3 className="text-xl font-bold text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
