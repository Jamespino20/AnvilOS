/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { RevealUp } from "./RevealUp";

export function StatsBar() {
  return (
    <section className="py-8 bg-muted border-y border-border relative overflow-hidden">
      {/* Industrial Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { stat: "99.9%", label: "System Uptime" },
            { stat: "500+", label: "Active Stores" },
            { stat: "<1s", label: "Sync Latency" },
            { stat: "10M+", label: "SKUs Managed" },
          ].map((item, i) => (
            <RevealUp
              key={item.label}
              delay={i * 100}
              className="text-center group"
            >
              <div className="text-3xl md:text-5xl font-black text-primary mb-1 tracking-tighter transition-all duration-300 group-hover:scale-105 group-hover:text-safety-orange">
                {item.stat}
              </div>
              <div className="text-[9px] md:text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                {item.label}
              </div>
            </RevealUp>
          ))}
        </div>
      </div>
    </section>
  );
}




