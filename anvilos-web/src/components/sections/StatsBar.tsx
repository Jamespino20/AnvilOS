import { RevealUp } from "./RevealUp";

export function StatsBar() {
  return (
    <section className="py-16 bg-surface-container border-y border-border relative overflow-hidden">
      {/* Industrial Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-8 relative z-10">
        {[
          { stat: "99.9%", label: "System Uptime" },
          { stat: "500+", label: "Active Stores" },
          { stat: "<1s", label: "Sync Latency" },
          { stat: "10M+", label: "SKUs Managed" },
        ].map((item, i) => (
          <RevealUp key={item.label} delay={i * 100} className="flex-1 text-center px-4 group">
            <div className="text-4xl md:text-5xl font-black text-primary mb-2 tracking-tighter transition-all duration-300 group-hover:scale-105 group-hover:text-safety-orange">
              {item.stat}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{item.label}</div>
          </RevealUp>
        ))}
      </div>
    </section>
  );
}
