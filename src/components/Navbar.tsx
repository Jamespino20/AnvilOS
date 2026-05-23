/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthModal } from "./auth/AuthModal";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");

  // Persistence state: This keeps data alive during the session on this page
  const [formData, setFormData] = useState({
    sellerName: "",
    username: "",
    email: "",
    password: "",
  });

  const updateAuthField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openAuth = (view: "login" | "register") => {
    setAuthView(view);
    setAuthModalOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when opening auth
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Marketplace", href: "/marketplace" },
    { name: "Inventory", href: "/inventory" },
    { name: "Solutions", href: "/solutions" },
    { name: "Company", href: "/company" },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed z-50 w-full transition-all duration-500 px-6",
          isScrolled
            ? "top-4 left-4 right-4 w-[calc(100%-2rem)] bg-background/95 backdrop-blur-xl border border-white/10 py-3 shadow-xl rounded-xl"
            : "top-0 bg-transparent border-b border-transparent py-4",
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 min-w-[140px] overflow-hidden">
              <img
                src="/images/CWLHardware_Logo.png"
                alt="CWL Hardware"
                className={cn(
                  "h-full w-auto object-contain transition-all duration-500",
                  !isScrolled && !isMobileMenuOpen && "brightness-0 invert",
                )}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-bold uppercase tracking-widest transition-colors hover:text-safety-orange",
                  isScrolled ? "text-muted-foreground" : "text-white/80",
                )}
              >
                {item.name}
              </Link>
            ))}

            <div className="flex items-center gap-4 border-l border-white/10 pl-8 ml-4">
              <button
                onClick={() => openAuth("login")}
                className={cn(
                  "text-sm font-bold uppercase tracking-widest transition-colors hover:text-safety-orange",
                  isScrolled ? "text-foreground" : "text-white",
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("register")}
                className={cn(
                  "px-5 py-2 text-sm font-bold uppercase tracking-widest rounded-sm transition-all active:scale-95",
                  isScrolled
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-white text-industrial-blue hover:bg-white/90",
                )}
              >
                Join
              </button>
            </div>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors",
              isScrolled || isMobileMenuOpen ? "text-foreground" : "text-white",
            )}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-background border-l border-white/10 z-[60] md:hidden shadow-2xl p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <img
                  src="/images/CWLHardware_Logo.png"
                  alt="CWL Hardware"
                  className="h-8 w-auto"
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-safety-orange transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
                <button
                  onClick={() => openAuth("login")}
                  className="w-full py-4 text-sm font-bold uppercase tracking-widest text-foreground bg-secondary hover:bg-secondary/80 rounded-sm transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className="w-full py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground bg-primary hover:bg-primary/90 rounded-sm shadow-lg shadow-primary/20 transition-all font-bold"
                >
                  Start Building
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authView}
        formData={formData}
        updateField={updateAuthField}
      />
    </>
  );
}
