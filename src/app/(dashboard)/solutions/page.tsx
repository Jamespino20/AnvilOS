import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";

export default function SolutionsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-safety-orange/10 text-safety-orange text-xs font-bold uppercase tracking-widest mb-6">
            Solutions Architecture
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-primary mb-6 tracking-tighter">
            ENTERPRISE <span className="text-safety-orange">SOLUTIONS</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Tailored hardware management stacks for industrial distributors and multi-location retail chains.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {[
              { title: "Multi-Store Sync", desc: "Unified inventory and financial reporting across all branches." },
              { title: "Custom API Integration", desc: "Connect your existing ERP or accounting software to the AnvilOS core." }
            ].map((item) => (
              <div key={item.title} className="p-8 bg-card border border-border rounded-sm">
                <h3 className="text-2xl font-bold text-primary mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
