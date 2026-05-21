/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
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
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">Built for the <span className="text-safety-orange">Hardware Industry</span></h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">AnvilOS was born from the belief that hardware stores deserve software as robust as the tools they sell.</p>
          </RevealUp>
        </div>
      </section>
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center mb-24">
            <RevealUp className="flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-primary mb-6 tracking-tight">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">To provide industrial-grade, cloud-enabled management tools that empower hardware businesses of all sizes to operate with precision, efficiency, and confidence.</p>
              <p className="text-muted-foreground leading-relaxed">We believe that great software should be accessible, reliable, and purpose-built — not generic tools retrofitted for hardware operations.</p>
            </RevealUp>
            <RevealUp delay={150} className="flex-1">
              <div className="aspect-square rounded-xl bg-[#0a151b] border border-white/5 overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="relative z-10 flex items-center justify-center h-full"><span className="text-white/10 font-black text-7xl tracking-tighter italic">ANVIL</span></div>
              </div>
            </RevealUp>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: "2024", label: "Founded" },
              { value: "500+", label: "Active Stores" },
              { value: "10M+", label: "SKUs Managed" },
            ].map((s, i) => (
              <RevealUp key={s.label} delay={i * 100}>
                <div className="bg-card border border-border rounded-xl p-8 text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl font-black text-safety-orange mb-2">{s.value}</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{s.label}</div>
                </div>
              </RevealUp>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted border-y border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <RevealUp>
            <h2 className="text-3xl font-black text-primary mb-4 tracking-tight">Want to Work With Us?</h2>
            <p className="text-muted-foreground mb-8">We are always looking for talented people who want to build the future of industrial software.</p>
            <a href="/contact" className="inline-block px-8 py-3.5 bg-safety-orange text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-lg shadow-safety-orange/20 cursor-pointer">View Careers</a>
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
      <main className="min-h-screen"><Content /></main>
      <Footer />
    </>
  );
}
