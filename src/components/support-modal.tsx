"use client";

import { X, HelpCircle, Mail, MessageCircle, BookOpen } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SupportModal({ open, onClose }: Props) {
  if (!open) return null;

  const links = [
    {
      icon: BookOpen,
      label: "Documentation",
      desc: "Guides and API reference",
      href: "#",
    },
    {
      icon: MessageCircle,
      label: "Live Chat",
      desc: "Chat with support team",
      href: "#",
    },
    {
      icon: Mail,
      label: "Email Support",
      desc: "anvilos.saas@gmail.com",
      href: "mailto:anvilos.saas@gmail.com",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center"
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#fd761a]" /> Support
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg border border-[#e2e8f0] hover:border-[#fd761a]/30 hover:bg-[#fff5ed] transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center group-hover:bg-[#fd761a]/10 group-hover:text-[#fd761a] transition-all">
                <link.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0e212c]">
                  {link.label}
                </p>
                <p className="text-xs text-[#94a3b8]">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-[#e2e8f0] text-center">
          <p className="text-xs text-[#94a3b8]">
            Response time: within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}




