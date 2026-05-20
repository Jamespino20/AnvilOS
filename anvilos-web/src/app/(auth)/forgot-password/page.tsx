"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import bcrypt from "bcryptjs";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite book?",
  "What was the make of your first car?",
  "What elementary school did you attend?",
  "What is your favorite food?",
];

type Step = "verify-user" | "security-questions" | "reset-password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("verify-user");
  const [username, setUsername] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerifyUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/security-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) {
      setError("User not found");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setQuestions(data.questions);
    setStep("security-questions");
    setLoading(false);
  }

  async function handleVerifyAnswers(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, answers }),
    });

    if (!res.ok) {
      setError("Incorrect answers");
      setLoading(false);
      return;
    }

    setStep("reset-password");
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, passwordHash }),
    });

    if (!res.ok) {
      setError("Failed to reset password");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg border border-outline-variant">
        <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-sm text-on-surface-variant text-center mb-6">
          {step === "verify-user" && "Enter your username to begin"}
          {step === "security-questions" && "Answer your security questions"}
          {step === "reset-password" && "Choose a new password"}
        </p>

        {error && <p className="text-sm text-error bg-error-container/30 rounded-md px-3 py-2 mb-4">{error}</p>}

        {step === "verify-user" && (
          <form onSubmit={handleVerifyUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-outline px-3 py-2 text-sm" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold disabled:opacity-50">
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {step === "security-questions" && (
          <form onSubmit={handleVerifyAnswers} className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="space-y-1">
                <label className="text-sm font-medium">{q}</label>
                <input type="text" value={answers[i]} onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }} className="w-full rounded-lg border border-outline px-3 py-2 text-sm" required />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold disabled:opacity-50">
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}

        {step === "reset-password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-outline px-3 py-2 text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-outline px-3 py-2 text-sm" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold disabled:opacity-50">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-on-surface-variant mt-4">
          <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
