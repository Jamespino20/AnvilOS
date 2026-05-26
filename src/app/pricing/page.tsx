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

const plans = [
  {
    name: "Starter",
    desc: "For single-location stores getting off the ground.",
    price: "$99",
    period: "/mo per register",
    features: [
      "Core POS functionality",
      "Basic inventory tracking",
      "Standard reporting",
      "Email support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Pro",
    desc: "For growing hardware centers needing advanced control.",
    price: "$199",
    period: "/mo per location",
    features: [
      "Everything in Starter",
      "Unlimited registers",
      "Offline mode resilience",
      "Supplier PO sync",
      "24/7 Phone support",
    ],
    cta: "Get Pro",
    featured: true,
  },
  {
    name: "Enterprise",
    desc: "Custom deployment for multi-store chains.",
    price: "Custom",
    period: " pricing",
    features: [
      "Everything in Pro",
      "Multi-location routing",
      "Custom API integrations",
      "Dedicated success manager",
      "On-premise options",
    ],
    cta: "Contact Sales",
    featured: false,
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
              Simple Pricing.{" "}
              <span className="text-safety-orange">No Surprises.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Transparent tiers scaled to your operation. No hidden fees, no
              long-term contracts.
            </p>
          </RevealUp>
        </div>
      </section>
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {plans.map((plan, i) => (
              <RevealUp key={plan.name} delay={i * 100}>
                <div
                  className={`flex flex-col p-8 rounded-xl border transition-all duration-300 h-full ${plan.featured ? "bg-primary text-primary-foreground border-safety-orange shadow-xl scale-105 md:-translate-y-4 hover:-translate-y-6 hover:shadow-2xl z-10 relative" : "bg-card border-border hover:shadow-xl hover:-translate-y-2"}`}
                >
                  {plan.featured && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-safety-orange text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3
                    className={`text-xl font-black mb-2 ${plan.featured ? "text-primary-foreground" : "text-primary"}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-6 min-h-[40px] ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {plan.desc}
                  </p>
                  <div className="mb-8">
                    <span
                      className={`text-4xl font-black tracking-tight ${plan.featured ? "text-primary-foreground" : "text-primary"}`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3 flex-grow mb-8">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-center gap-3 text-sm ${plan.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0 text-safety-orange"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer ${plan.featured ? "bg-safety-orange text-white hover:brightness-110 shadow-lg" : "bg-muted border border-border text-primary hover:bg-muted/80"}`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </RevealUp>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted border-y border-border">
        <div className="max-w-3xl mx-auto px-6">
          <RevealUp className="text-center mb-12">
            <h2 className="text-3xl font-black text-primary mb-4 tracking-tight">
              Frequently Asked
            </h2>
          </RevealUp>
          <div className="space-y-6">
            {[
              {
                q: "Is there a free trial?",
                a: "Yes. All plans include a 14-day free trial with full access to every feature. No credit card required.",
              },
              {
                q: "Can I switch plans later?",
                a: "Absolutely. Upgrade or downgrade at any time. Changes take effect immediately.",
              },
              {
                q: "What kind of support do you offer?",
                a: "Starter includes email support. Pro adds 24/7 phone support. Enterprise includes a dedicated success manager.",
              },
            ].map((f, i) => (
              <RevealUp key={i} delay={i * 50}>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-bold text-primary mb-2">{f.q}</h3>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </div>
              </RevealUp>
            ))}
          </div>
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




