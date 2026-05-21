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
import { AuthModal } from "./auth/AuthModal";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
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
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-500 px-6 py-4",
          isScrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-white/10 py-3 shadow-sm"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 min-w-[140px] overflow-hidden">
              <img
                src="/images/anvilos_landscapelogo.png"
                alt="AnvilOS"
                className={cn(
                  "h-full w-auto object-contain transition-all duration-500",
                  !isScrolled && "brightness-0 invert",
                )}
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {["Marketplace", "Inventory", "Solutions", "Company"].map(
              (item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className={cn(
                    "text-sm font-bold uppercase tracking-widest transition-colors hover:text-safety-orange",
                    isScrolled ? "text-muted-foreground" : "text-white/80",
                  )}
                >
                  {item}
                </Link>
              ),
            )}

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
        </div>
      </nav>

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
