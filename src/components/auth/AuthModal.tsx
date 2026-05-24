/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AuthView = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  formData: any;
  updateField: (field: string, value: string) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialView = "login",
  formData,
  updateField,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthView>(initialView);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: formData.email, // Using email field as username for credentials
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Authentication Failed", {
          description: "Please check your credentials and security clearance.",
        });
      } else {
        toast.success("Access Granted", {
          description: "Establishing secure connection to dashboard...",
        });
        onClose();
        window.location.href = "/dashboard";
      }
    } catch (error) {
      toast.error("System Error", {
        description: "An unexpected error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.sellerName, // Map legal name to username for now
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Initialization Failed", {
          description: data.error || "Profile forging could not be completed.",
        });
      } else {
        toast.success("Profile Forged", {
          description: "Identity recognized. Logging in...",
        });

        // Auto sign in after registration
        const result = await signIn("credentials", {
          username: formData.sellerName,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          onClose();
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      toast.error("Protocol Violation", {
        description: "Communication with the registration server failed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
        >
          <div
            className="bg-white w-full max-w-[440px] mx-4 rounded-xl shadow-2xl border border-[#e2e8f0] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col relative">
              {/* Premium Header */}
              <div className="bg-gradient-to-br from-[#0e212c] to-[#1a3a4a] px-8 py-12 text-white relative border-b border-white/5 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#fd761a]/50 shadow-lg shadow-[#fd761a]/20" />

                <button
                  onClick={onClose}
                  className="absolute right-4 top-6 rounded-sm opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="h-5 w-5" />
                </button>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-1 z-10 relative"
                >
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-none italic">
                    CWL<span className="text-[#fd761a]">Hardware</span>
                  </h2>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">
                    Industrial Gateway • Secure Access v2.5
                  </p>
                </motion.div>

                <div className="absolute -right-4 -bottom-4 text-9xl font-black text-white/5 pointer-events-none select-none italic tracking-tighter">
                  FORGE
                </div>
              </div>

              {/* Tab Buttons */}
              <div className="px-8 pt-6 pb-2">
                <div className="grid grid-cols-2 gap-1 bg-[#f1f5f9] p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("login")}
                    className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === "login" ? "bg-white shadow-sm text-[#0e212c]" : "text-[#64748b] hover:text-[#0e212c]"}`}
                  >
                    Authenticate
                  </button>
                  <button
                    onClick={() => setActiveTab("register")}
                    className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === "register" ? "bg-white shadow-sm text-[#0e212c]" : "text-[#64748b] hover:text-[#0e212c]"}`}
                  >
                    Initialize
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{
                      opacity: 0,
                      x: activeTab === "login" ? -10 : 10,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === "login" ? 10 : -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === "login" ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="login-email"
                            className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"
                          >
                            Merchant Identity / Username
                          </Label>
                          <Input
                            id="login-email"
                            type="text"
                            required
                            placeholder="operator01"
                            value={formData.email}
                            onChange={(e) =>
                              updateField("email", e.target.value)
                            }
                            className="text-[#0e212c] border-[#e2e8f0] focus:border-[#fd761a]"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label
                              htmlFor="login-pass"
                              className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"
                            >
                              Security Protocol / Password
                            </Label>
                          </div>
                          <Input
                            id="login-pass"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) =>
                              updateField("password", e.target.value)
                            }
                            className="text-[#0e212c] border-[#e2e8f0] focus:border-[#fd761a]"
                            disabled={isLoading}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 bg-[#0e212c] hover:bg-[#1a3a4a] text-white font-bold uppercase tracking-widest text-[11px] rounded-lg mt-2 shadow-xl shadow-[#0e212c]/10"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>Proceed to Dashboard →</>
                          )}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="reg-name"
                            className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"
                          >
                            Legal Entity / Merchant ID
                          </Label>
                          <Input
                            id="reg-name"
                            type="text"
                            required
                            placeholder="operator01"
                            value={formData.sellerName}
                            onChange={(e) =>
                              updateField("sellerName", e.target.value)
                            }
                            className="text-[#0e212c] border-[#e2e8f0] focus:border-[#fd761a]"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="reg-email"
                            className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"
                          >
                            Communication Link / Email
                          </Label>
                          <Input
                            id="reg-email"
                            type="email"
                            required
                            placeholder="enterprise@company.com"
                            value={formData.email}
                            onChange={(e) =>
                              updateField("email", e.target.value)
                            }
                            className="text-[#0e212c] border-[#e2e8f0] focus:border-[#fd761a]"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="reg-pass"
                            className="text-xs font-semibold text-[#64748b] uppercase tracking-wider"
                          >
                            Access Sequence / Password
                          </Label>
                          <Input
                            id="reg-pass"
                            type="password"
                            required
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={(e) =>
                              updateField("password", e.target.value)
                            }
                            className="text-[#0e212c] border-[#e2e8f0] focus:border-[#fd761a]"
                            disabled={isLoading}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 bg-[#fd761a] hover:bg-[#e56600] text-white font-bold uppercase tracking-widest text-[11px] rounded-lg mt-2 shadow-xl shadow-[#fd761a]/10"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>Forge New Profile →</>
                          )}
                        </Button>
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Status Footer */}
              <div className="bg-[#f8fafc] px-8 py-4 border-t border-[#e2e8f0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-green-500 animate-pulse"}`}
                  />
                  <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest">
                    {isLoading ? "Processing Link..." : "System Online"}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#94a3b8] opacity-50">
                  AV-GATE-v2.5.0
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
