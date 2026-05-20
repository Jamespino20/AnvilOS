import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        
        {/* Placeholder sections to demonstrate scroll effect */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-industrial-blue mb-12">The Industrial Standard</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-8 border border-border rounded-sm hover:border-safety-orange transition-colors">
                  <div className="w-12 h-12 bg-safety-orange/10 flex items-center justify-center rounded-sm mb-6 text-safety-orange">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Enterprise Efficiency</h3>
                  <p className="text-muted-foreground">
                    Streamline your hardware retail operations with our high-torque inventory management engine.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-extrabold text-industrial-blue tracking-tighter mb-6">
                BUILT TO LAST. <br />
                <span className="text-safety-orange">SCALED FOR GROWTH.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Transition from a single retail location to a nationwide SaaS enterprise 
                without breaking your critical infrastructure.
              </p>
              <button className="px-8 py-3 bg-industrial-blue text-white font-bold rounded-sm hover:bg-industrial-blue/90 transition-all">
                View Solutions
              </button>
            </div>
            <div className="flex-1 w-full aspect-video bg-industrial-blue/10 border border-border rounded-sm overflow-hidden relative">
               <div className="absolute inset-0 flex items-center justify-center text-industrial-blue/20 font-bold text-4xl italic">
                 PLATFORM PREVIEW
               </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
