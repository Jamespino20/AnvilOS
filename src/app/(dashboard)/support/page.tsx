"use client";

import { useState } from "react";
import { Mail, MessageSquare, BookOpen, ChevronDown, Send, CheckCircle } from "lucide-react";

const faqs = [
  { q: "How do I add a new product?", a: "Navigate to Inventory via the sidebar, then click the \"Add Product\" button in the top-right corner. Fill in the required fields and save." },
  { q: "How do I process a return?", a: "Open the POS Terminal, select \"Return\" as the transaction type, enter the original receipt number, and add the items being returned." },
  { q: "What does a low stock alert mean?", a: "Products whose current quantity is at or below their minimum threshold will trigger low stock alerts. You'll see a notification and the inventory will highlight them in red." },
  { q: "Can I edit a transaction after it's posted?", a: "Yes. Go to Transactions, find the receipt, and click Edit. Note that stock adjustments are recalculated automatically." },
  { q: "How do I generate reports?", a: "The Dashboard shows daily sales KPIs. For detailed reports, visit the Transactions page and use the export option." },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Support</h1>
        <p className="text-sm text-[#64748b] mt-1">Help resources and contact information</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, title: "Documentation", desc: "Browse our knowledge base for guides and tutorials", color: "from-blue-500 to-blue-600" },
          { icon: MessageSquare, title: "Live Chat", desc: "Chat with our support team in real-time", color: "from-emerald-500 to-emerald-600" },
          { icon: Mail, title: "Email Us", desc: "Send us a message and we'll get back to you within 24h", color: "from-[#fd761a] to-[#e56600]" },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-5 hover:shadow-lg hover:shadow-black/5 transition-all">
            <div className={`w-11 h-11 mb-4 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-sm text-[#0e212c]">{card.title}</h3>
            <p className="text-xs text-[#64748b] mt-1 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-semibold text-lg text-emerald-800">Message Sent!</h3>
          <p className="text-sm text-emerald-600 mt-1">We'll get back to you within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0e212c]">Contact Us</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Your Name" required className="px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
            <input type="email" placeholder="Your Email" required className="px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
          </div>
          <select className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10">
            <option value="">Select a topic</option>
            <option>Account Issue</option>
            <option>Bug Report</option>
            <option>Feature Request</option>
            <option>Billing Question</option>
            <option>Other</option>
          </select>
          <textarea rows={4} placeholder="Describe your issue..." required className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 resize-none" />
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98]">
            <Send className="h-4 w-4" /> Send Message
          </button>
        </form>
      )}

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-1">
        <h2 className="text-lg font-semibold text-[#0e212c] mb-4">Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-[#e2e8f0] last:border-b-0">
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between py-3.5 text-sm font-medium text-[#0e212c] hover:text-[#fd761a] transition-colors">
              {faq.q}
              <ChevronDown className={`h-4 w-4 text-[#94a3b8] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
            </button>
            {openFaq === i && (
              <p className="pb-4 text-sm text-[#64748b] leading-relaxed">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
