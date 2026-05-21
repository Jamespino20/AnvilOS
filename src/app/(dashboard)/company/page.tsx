/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";

export default function CompanyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-safety-orange/10 text-safety-orange text-xs font-bold uppercase tracking-widest mb-6">
            About AnvilOS
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-primary mb-6 tracking-tighter">
            THE <span className="text-safety-orange">ANVIL</span> STORY
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Born from the rugged requirements of industrial warehouses, AnvilOS was engineered to bridge the gap between legacy hardware retail and the modern SaaS ecosystem.
          </p>
          <div className="bg-surface-container border border-border p-8 rounded-sm text-left">
            <h2 className="text-2xl font-bold text-primary mb-4 uppercase tracking-tight">Our Mission</h2>
            <p className="text-muted-foreground"> To empower independent hardware businesses with enterprise-grade tools that are as durable and reliable as the tools they sell.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
