/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 11, 2026
*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Shield, Loader2, X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/clear-cookies", { credentials: "same-origin" }).catch(() => {});
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTotpModal, setShowTotpModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      totp: "",
      redirect: false,
    });

    if (!result?.error) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (result.error === "TOTP_REQUIRED") {
      setShowTotpModal(true);
      setLoading(false);
      return;
    }

    setError("Invalid username or password");
    setLoading(false);
  }

  async function handleTotpSubmit() {
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      totp,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid authenticator code");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function handleCancelTotp() {
    setShowTotpModal(false);
    setTotp("");
    setLoading(false);
  }

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-[#F1F5F9] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/CWLHardware_Location.png')] bg-cover bg-center opacity-10" />
      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img
            src="/images/CWLHardware_Logo.png"
            alt="CWL Hardware"
            className="h-10 w-auto mx-auto"
          />
          <p className="text-on-surface-variant mt-2 text-sm">
            Hardware & Supply
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-xl rounded-xl p-8 shadow-2xl shadow-black/10 border border-white/20 space-y-5"
        >
          <h2 className="text-xl font-semibold text-center">Sign In</h2>
          {error && (
            <p className="text-sm text-error bg-error-container/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">
              Username / Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter username or email"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-outline px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="flex justify-center text-sm">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>

      {/* TOTP Modal */}
      {showTotpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="auth-page bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-white/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#fd761a]" />
                <h3 className="text-lg font-semibold text-[#0e212c]">
                  Authenticator Required
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelTotp}
                className="text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[#64748b]">
              Enter the six-digit code from your authenticator app to complete
              sign-in.
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm text-center text-[#0e212c] tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a]"
              placeholder="000000"
              autoFocus
              maxLength={6}
            />
            {error && (
              <p className="text-sm text-rose-600 text-center">{error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelTotp}
                className="flex-1 px-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTotpSubmit}
                disabled={loading || totp.length !== 6}
                className="flex-1 px-4 py-2.5 bg-[#fd761a] text-white rounded-lg text-sm font-semibold hover:bg-[#e56600] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
