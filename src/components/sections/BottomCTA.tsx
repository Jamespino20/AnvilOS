/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

import { RevealUp } from "./RevealUp";

export function BottomCTA() {
  return (
    <section className="py-24 bg-primary border-y border-accent" id="cta">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <RevealUp>
          <h2 className="text-4xl md:text-5xl font-black text-primary-foreground mb-6 tracking-tight">Ready to Upgrade Your Floor?</h2>
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of stores already running on AnvilOS. Start your free trial today and experience the difference of purpose-built industrial software.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-10 py-4 bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all duration-200 active:scale-95 shadow-xl">
              Start Free Trial
            </button>
            <button className="px-10 py-4 bg-transparent text-primary-foreground border border-primary-foreground/30 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-white/5 transition-all duration-200 active:scale-95">
              Talk to Sales
            </button>
          </div>
        </RevealUp>
      </div>
    </section>
  );
}
