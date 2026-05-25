/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import Link from "next/link";

const footerLinks: Record<string, [string, string][]> = {
  Product: [
    ["Features", "/solutions"],
    ["Pricing", "/pricing"],
  ],
  Company: [
    ["About", "/solutions"],
    ["Contact", "/contact"],
  ],
  Support: [
    ["Documentation", "#"],
    ["Contact", "/contact"],
  ],
  Legal: [
    ["Privacy Policy", "/contact"],
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <img
              src="/images/CWLHardware_Logo.png"
              alt="CWL Hardware"
              className="h-8 w-auto opacity-80 dark:brightness-0 dark:invert"
            />
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Industrial-grade POS and inventory management for hardware stores
              and warehouse operations.
            </p>
          </div>
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-primary hover:text-accent transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            &copy; {new Date().getFullYear()} CWL Hardware. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Twitter", "GitHub", "LinkedIn"].map((s) => (
              <Link
                key={s}
                href="#"
                className="text-[10px] text-muted-foreground hover:text-accent uppercase tracking-wider transition-colors"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
