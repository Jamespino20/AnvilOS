/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

"use client";

import { RevealUp } from "./RevealUp";

export function ContactForm() {
  return (
    <section className="py-24 bg-background" id="contact">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24">
          <RevealUp className="flex-1">
            <h2 className="text-4xl font-black text-primary mb-6 tracking-tight">Get In Touch.</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Have a specific setup or a question about migrating from an existing system? Our team is ready to help you find the right solution.
            </p>
            <div className="space-y-6">
              {[
                { icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ), value: "hello@anvilos.com" },
                { icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ), value: "+1 (800) 555-ANVIL" },
                { icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ), value: "123 Industrial Way, Suite 200, Portland, OR 97201" },
              ].map((item) => (
                <div key={item.value} className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-accent">{item.icon}</div>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </RevealUp>
          <RevealUp delay={150} className="flex-1 w-full">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">First Name</label>
                  <input className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent transition-shadow" placeholder="John" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Last Name</label>
                  <input className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent transition-shadow" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email</label>
                <input type="email" className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent transition-shadow" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Company</label>
                <input className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent transition-shadow" placeholder="BuildRite Hardware" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Message</label>
                <textarea rows={4} className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent transition-shadow resize-none" placeholder="Tell us about your store and what you need..." />
              </div>
              <button type="submit" className="w-full py-4 bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all duration-200 active:scale-95 shadow-lg">
                Send Message
              </button>
            </form>
          </RevealUp>
        </div>
      </div>
    </section>
  );
}
