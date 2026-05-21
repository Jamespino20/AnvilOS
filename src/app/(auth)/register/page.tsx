/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { Eye, EyeOff } from "lucide-react";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite book?",
  "What was the make of your first car?",
  "What elementary school did you attend?",
  "What is your favorite food?",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    sellerName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityQ1: SECURITY_QUESTIONS[0],
    securityA1: "",
    securityQ2: SECURITY_QUESTIONS[1],
    securityA2: "",
    securityQ3: SECURITY_QUESTIONS[2],
    securityA3: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const passwordHash = await bcrypt.hash(form.password, 10);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, passwordHash }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto login after register
    const result = await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      router.push("/login");
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <img
            src="/images/anvilos_landscapelogo.png"
            alt="AnvilOS"
            className="h-10 w-auto mx-auto brightness-0"
            style={{
              filter: "brightness(0) sepia(1) hue-rotate(190deg) saturate(3)",
            }}
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
                <label className="text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
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
            <hr className="border-outline-variant" />
            <p className="text-sm text-on-surface-variant">
              Security Questions (for password recovery)
            </p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <select
                  value={
                    form[`securityQ${i + 1}` as keyof typeof form] as string
                  }
                  onChange={(e) => update(`securityQ${i + 1}`, e.target.value)}
                  className="w-full rounded-lg border border-outline px-3 py-2 text-sm"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={
                    form[`securityA${i + 1}` as keyof typeof form] as string
                  }
                  onChange={(e) => update(`securityA${i + 1}`, e.target.value)}
                  className="w-full rounded-lg border border-outline px-3 py-2 text-sm"
                  placeholder={`Answer ${i + 1} (optional)`}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
            <p className="text-sm text-center text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
