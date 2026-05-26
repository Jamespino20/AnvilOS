/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { RevealUp } from "./RevealUp";

export function Pricing() {
  const plans = [
    {
      name: "Starter",
      description: "For single-location stores getting off the ground.",
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
      description: "For growing hardware centers needing advanced control.",
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
      description: "Custom deployment for multi-store chains.",
      price: "Custom",
      period: " pricing",
      features: [
        "Everything in Pro",
        "Multi-location inventory routing",
        "Custom API integrations",
        "Dedicated success manager",
        "On-premise deployment options",
      ],
      cta: "Contact Sales",
      featured: false,
    },
  ];

  return (
    <section
      className="py-16 bg-background border-y border-border overflow-hidden"
      id="pricing"
    >
      <div className="max-w-7xl mx-auto px-6">
        <RevealUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-primary mb-4 tracking-tight">
            Straightforward Pricing for Solid Software
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No hidden fees, no complex tiers. Just robust tools scaled to your
            operation size.
          </p>
        </RevealUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {plans.map((plan, i) => (
            <RevealUp key={plan.name} delay={i * 100}>
              <div
                className={`flex flex-col p-8 rounded-sm border transition-all duration-300 h-full ${
                  plan.featured
                    ? "bg-primary text-primary-foreground border-accent shadow-xl scale-105 md:-translate-y-4 hover:-translate-y-6 hover:shadow-2xl z-20 relative"
                    : "bg-card border-border hover:shadow-xl hover:-translate-y-2 relative z-10"
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-foreground px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider z-30">
                    Most Popular
                  </div>
                )}
                <h3
                  className={`text-xl font-black mb-2 ${plan.featured ? "text-primary-foreground" : "text-primary dark:text-[#0e212c]"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-6 min-h-[40px] ${plan.featured ? "text-primary-foreground/70" : "text-primary/70"}`}
                >
                  {plan.description}
                </p>
                <div className="mb-8">
                  <span
                    className={`text-4xl font-black tracking-tight ${plan.featured ? "text-primary-foreground" : "text-primary"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${plan.featured ? "text-primary-foreground/70" : "text-primary/60"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 flex-grow mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-center gap-3 text-sm ${plan.featured ? "text-primary-foreground/80" : "text-primary/80"}`}
                    >
                      <svg
                        className={`w-5 h-5 flex-shrink-0 text-accent`}
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
                  className={`w-full py-4 text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-200 active:scale-95 ${
                    plan.featured
                      ? "bg-accent text-accent-foreground hover:brightness-110 shadow-lg"
                      : "bg-primary text-white hover:bg-primary/90 shadow-md"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </RevealUp>
          ))}
        </div>
      </div>
    </section>
  );
}




