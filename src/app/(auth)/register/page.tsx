/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 12, 2026
*/

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    sellerName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verifyToken, setVerifyToken] = useState("");
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    setVerifyToken(
      new URLSearchParams(window.location.search).get("verifyToken") || "",
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    setVerifyToken(data.verifyToken || "");
    setMessage("We sent a verification code to your email.");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verifyToken, code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Verification failed");
      return;
    }
    setVerified(true);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-[#F1F5F9] py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <img
            src="/images/CWLHardware_Logo.png"
            alt="CWL Hardware"
            className="h-10 w-auto mx-auto"
          />
          <p className="text-on-surface-variant mt-1 text-xs">
            Hardware & Supply
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-xl rounded-xl p-8 shadow-2xl shadow-black/10 border border-white/20">
          <h1 className="text-2xl font-bold text-center mb-6">
            Create Account
          </h1>
          {error && (
            <p className="text-sm text-error bg-error-container/30 rounded-md px-3 py-2 mb-4">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-[#0e212c] bg-[#fff5ed] rounded-md px-3 py-2 mb-4">
              {message}
            </p>
          )}

          {!verifyToken && !verified && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={form.sellerName}
                    onChange={(e) => update("sellerName", e.target.value)}
                    className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className="w-full rounded-lg border border-outline px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        update("confirmPassword", e.target.value)
                      }
                      className="w-full rounded-lg border border-outline px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                    >
                      {showConfirmPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
          )}

          {verifyToken && !verified && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Email Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-lg border border-outline px-3 py-2 text-sm tracking-[0.35em] text-center"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code}
                className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>
          )}

          {verified && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[#0e212c]">
                Your account is verified. You can now sign in.
              </p>
              <Link
                href="/login"
                className="inline-flex w-full justify-center py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold"
              >
                Go to Login
              </Link>
            </div>
          )}

          <p className="text-sm text-center text-on-surface-variant mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
