import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  updateField 
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthView>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
        router.push("/dashboard");
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
          router.push("/dashboard");
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-[440px] overflow-hidden border-white/10 shadow-2xl industrial-grain animate-snappy">
          
          <div className="flex flex-col relative">
            {/* Premium Header */}
            <div className="bg-industrial-gradient px-8 py-12 text-white relative border-b border-white/5 overflow-hidden">
              {/* Decorative Industrial Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-safety-orange/50 shadow-lg shadow-safety-orange/20" />
              
              <DialogClose className="absolute right-4 top-6 rounded-sm opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-safety-orange/50">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogClose>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="space-y-1 z-10 relative"
              >
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none italic">
                  Anvil<span className="text-safety-orange">OS</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">
                  Industrial Gateway • Secure Access v2.5
                </DialogDescription>
              </motion.div>

              {/* Background Accent */}
              <div className="absolute -right-4 -bottom-4 text-9xl font-black text-white/5 pointer-events-none select-none italic tracking-tighter">
                FORGE
              </div>
            </div>

            {/* Content Tabs */}
            <div className="px-8 py-8">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AuthView)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-50 p-1 border border-border/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">AUTHENTICATE</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">INITIALIZE</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: activeTab === "login" ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === "login" ? 10 : -10 }}
                    transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                  >
                    <TabsContent value="login" className="space-y-5 m-0 border-none p-0">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Merchant Identity / Username</Label>
                          <Input 
                            id="login-email" 
                            type="text" 
                            required
                            placeholder="operator01"
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            className="focus-visible:border-b-safety-orange"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="login-pass">Security Protocol / Password</Label>
                            <button type="button" className="text-[10px] font-bold text-safety-orange uppercase hover:underline">Reset</button>
                          </div>
                          <Input 
                            id="login-pass" 
                            type="password" 
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => updateField("password", e.target.value)}
                            className="focus-visible:border-b-safety-orange"
                            disabled={isLoading}
                          />
                        </div>
                        <Button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 bg-industrial-blue hover:bg-industrial-blue/90 text-white font-bold uppercase tracking-widest text-[11px] rounded-none mt-2 shadow-xl shadow-industrial-blue/10 animate-snappy group"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Proceed to Dashboard
                              <motion.span 
                                initial={{ x: 0 }}
                                whileHover={{ x: 5 }}
                                className="ml-2 inline-block"
                              >
                                →
                              </motion.span>
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-5 m-0 border-none p-0">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-name">Legal Entity / Merchant ID</Label>
                          <Input 
                            id="reg-name" 
                            type="text" 
                            required
                            placeholder="operator01"
                            value={formData.sellerName}
                            onChange={(e) => updateField("sellerName", e.target.value)}
                            className="focus-visible:border-b-safety-orange"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-email">Communication Link / Email</Label>
                          <Input 
                            id="reg-email" 
                            type="email" 
                            required
                            placeholder="enterprise@company.com"
                            value={formData.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            className="focus-visible:border-b-safety-orange"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-pass">Access Sequence / Password</Label>
                          <Input 
                            id="reg-pass" 
                            type="password" 
                            required
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={(e) => updateField("password", e.target.value)}
                            className="focus-visible:border-b-safety-orange"
                            disabled={isLoading}
                          />
                        </div>
                        <Button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 bg-safety-orange hover:bg-safety-orange/90 text-white font-bold uppercase tracking-widest text-[11px] rounded-none mt-2 shadow-xl shadow-safety-orange/10 animate-snappy group"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Forge New Profile
                              <motion.span 
                                initial={{ x: 0 }}
                                whileHover={{ x: 5 }}
                                className="ml-2 inline-block"
                              >
                                →
                              </motion.span>
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </div>
            
            {/* Status Footer */}
            <div className="bg-slate-50/80 backdrop-blur-sm px-8 py-5 border-t border-border flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <span className={cn(
                   "w-1.5 h-1.5 rounded-full",
                   isLoading ? "bg-amber-500 animate-pulse" : "bg-green-500 animate-pulse"
                 )} />
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                   {isLoading ? "Processing Link..." : "System Online"}
                 </span>
               </div>
               <span className="text-[9px] font-mono text-muted-foreground opacity-50">
                 AV-GATE-v2.5.0
               </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
