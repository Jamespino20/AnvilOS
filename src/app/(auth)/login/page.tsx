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
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/warehouse-bg.jpg')] bg-cover bg-center opacity-10" />
      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img
            src="/images/anvilos_landscapelogo.png"
            alt="AnvilOS"
            className="h-10 w-auto mx-auto brightness-0"
            style={{
              filter: "brightness(0) sepia(1) hue-rotate(190deg) saturate(3)",
            }}
          />
          <p className="text-on-surface-variant mt-2 text-sm">
            Hardware & Supply
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="          bg-white/90 backdrop-blur-xl rounded-xl p-8 shadow-2xl shadow-black/10 border border-white/20 space-y-5"
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
          <div className="flex justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot Password?
            </Link>
            <Link href="/register" className="text-primary hover:underline">
              No account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
