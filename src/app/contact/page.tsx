/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

"use client";

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
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Get in <span className="text-safety-orange">Touch</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Have questions about CWL Hardware? Want a personalized demo? Our
              team is ready to help.
            </p>
          </RevealUp>
        </div>
      </section>
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <RevealUp className="flex-1">
              <h2 className="text-2xl font-black text-primary mb-6 tracking-tight">
                Contact Information
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                    value: "hello@anvilos.com",
                    href: "mailto:hello@anvilos.com",
                  },
                  {
                    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                    value: "+1 (800) 555-ANVIL",
                    href: "tel:+180055526845",
                  },
                  {
                    icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                    value: "123 Industrial Way, Suite 200, Portland, OR 97201",
                  },
                ].map((item) => (
                  <div
                    key={item.value}
                    className="flex items-center gap-4 text-sm text-muted-foreground"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-safety-orange shrink-0">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d={item.icon}
                        />
                      </svg>
                    </div>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="hover:text-safety-orange transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span>{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </RevealUp>
            <RevealUp delay={150} className="flex-1">
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-safety-orange transition-shadow"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-safety-orange transition-shadow"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-safety-orange transition-shadow"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Subject
                  </label>
                  <select className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-safety-orange transition-shadow">
                    <option>General Inquiry</option>
                    <option>Sales / Demo Request</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-safety-orange transition-shadow resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-safety-orange text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all active:scale-95 shadow-lg cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            </RevealUp>
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




