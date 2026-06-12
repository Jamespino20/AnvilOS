/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 12, 2026
*/

"use client";

import {
  Mail,
  MessageCircle,
  BookOpen,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

const supportOptions = [
  {
    icon: BookOpen,
    label: "Documentation",
    desc: "Step-by-step guides and API reference for all features",
    href: "#",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: MessageCircle,
    label: "Live Chat",
    desc: "Chat with our support team in real-time",
    href: "#",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Mail,
    label: "Email Support",
    desc: "Get help via email — response within 24 hours",
    href: "mailto:support@cwlhardware.com",
    color: "bg-amber-50 text-amber-600",
  },
];

const faqs = [
  {
    q: "How do I add a new product?",
    a: "Navigate to Inventory, click Add Product, fill in the details, and save.",
  },
  {
    q: "How do I process a return?",
    a: "Open the POS terminal, click the Returns tab, scan or search for the item, and complete the return.",
  },
  {
    q: "How do I generate a sales report?",
    a: "Go to Finance, select the date range, and click Export to download CSV, XLSX, or PDF.",
  },
  {
    q: "How do I manage user accounts?",
    a: "Go to Settings to update your profile, notification preferences, and password.",
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">
          Support
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Get help with CWL Hardware
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportOptions.map((opt) => (
          <a
            key={opt.label}
            href={opt.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-[#e2e8f0] rounded-xl p-5 hover:border-[#fd761a]/30 hover:shadow-md transition-all"
          >
            <div
              className={`w-10 h-10 rounded-lg ${opt.color} flex items-center justify-center mb-3`}
            >
              <opt.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#0e212c] group-hover:text-[#fd761a] transition-colors">
              {opt.label}
            </h3>
            <p className="text-xs text-[#94a3b8] mt-1">{opt.desc}</p>
          </a>
        ))}
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#0e212c] flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-[#fd761a]" /> Frequently Asked
          Questions
        </h2>
        <div className="mt-4 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group border border-[#e2e8f0] rounded-lg"
            >
              <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium text-[#0e212c] cursor-pointer hover:bg-[#f8fafc] rounded-lg transition-colors list-none">
                {faq.q}
                <ChevronRight className="h-4 w-4 text-[#94a3b8] group-open:rotate-90 transition-transform" />
              </summary>
              <p className="px-4 pb-3 text-xs text-[#64748b]">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="bg-[#0e212c] rounded-xl p-6 text-center">
        <p className="text-white text-sm font-semibold">Need more help?</p>
        <p className="text-[#94a3b8] text-xs mt-1">
          Our support team is available Monday to Saturday, 8:00 AM to 6:00 PM
        </p>
        <a
          href="mailto:support@cwlhardware.com"
          className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-[#fd761a] text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          <Mail className="h-4 w-4" /> Email Support
        </a>
      </div>
    </div>
  );
}
