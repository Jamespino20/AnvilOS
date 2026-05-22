/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

import { RevealUp } from "./RevealUp";

const testimonials = [
  {
    initials: "JD",
    name: "John Davis",
    role: "Owner, BuildRite Hardware",
    quote:
      "Switching to AnvilOS was the best decision we made. The speed at the checkout has halved our queue times during the morning rush.",
  },
  {
    initials: "SC",
    name: "Sarah Chen",
    role: "Warehouse Manager, Apex Supply",
    quote:
      "The offline mode is a lifesaver. We had a network outage last week, and the floor didn't even notice. Everything just synced up later.",
  },
  {
    initials: "MR",
    name: "Michael Ross",
    role: "Director of Ops, TimberTech",
    quote:
      "Managing over 50,000 SKUs used to be a nightmare. AnvilOS handles it effortlessly, and the reporting tools give us insights we never had.",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 bg-background relative overflow-hidden" id="testimonials">
      <div className="max-w-7xl mx-auto px-6">
        <RevealUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-primary mb-4 tracking-tight">
            Trusted by Store Owners Worldwide
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Hear from the people who rely on AnvilOS every single day to run
            their businesses.
          </p>
        </RevealUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <RevealUp key={t.name} delay={i * 100}>
              <div className="bg-card border border-border rounded-sm p-8 relative hover:shadow-md transition-shadow duration-300 h-full">
                <div className="text-5xl text-muted/30 absolute top-6 right-6 italic font-serif leading-none">
                  "
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-primary uppercase tracking-wider">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.role}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-primary/80 italic relative z-10 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            </RevealUp>
          ))}
        </div>
      </div>
    </section>
  );
}
