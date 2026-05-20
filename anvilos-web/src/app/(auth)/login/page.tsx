"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/warehouse-bg.jpg')] bg-cover bg-center opacity-10" />
      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">AnvilOS</h1>
          <p className="text-on-surface-variant mt-2">Hardware & Supply</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-outline-variant space-y-5">
          <h2 className="text-xl font-semibold text-center">Sign In</h2>
          {error && <p className="text-sm text-error bg-error-container/30 rounded-md px-3 py-2">{error}</p>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Enter username" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-on-surface">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Enter password" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="flex justify-between text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">Forgot Password?</Link>
            <Link href="/register" className="text-primary hover:underline">No account? Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
