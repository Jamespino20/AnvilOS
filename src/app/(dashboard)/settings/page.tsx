/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 7, 2026
*/

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  Shield,
  User,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { getNotifPrefs, updateNotifPrefs } from "@/actions/email";
import {
  confirmTotpSetup,
  disableTotp,
  startTotpSetup,
  updatePassword,
} from "@/actions";
import { toast } from "sonner";
import QRCode from "qrcode";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [active, setActive] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    notifLowStock: true,
    notifDailySales: true,
    notifTransaction: true,
  });
  const [loading, setLoading] = useState(true);

  // Security form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpEnabled, setTotpEnabled] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setTotpEnabled((session.user as any)?.totpEnabled ?? false);
    }
  }, [session]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (!totpSecret) {
      setQrCodeUrl("");
      return;
    }
    const account =
      (session?.user as any)?.email ||
      (session?.user as any)?.username ||
      "user";
    const otpauth = `otpauth://totp/CWL%20Hardware:${encodeURIComponent(account)}?secret=${totpSecret}&issuer=CWL%20Hardware`;
    QRCode.toDataURL(otpauth, {
      width: 200,
      margin: 2,
      color: { dark: "#0e212c", light: "#ffffff" },
    })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, [totpSecret, session]);

  // Appearance / theme
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("cwl-theme") as "light" | "dark" | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("cwl-theme", theme);
  }, [theme]);

  useEffect(() => {
    getNotifPrefs().then((data) => {
      if (data) {
        setNotifPrefs({
          notifLowStock: data.notifLowStock,
          notifDailySales: data.notifDailySales,
          notifTransaction: data.notifTransaction,
        });
      }
      setLoading(false);
    });
  }, []);

  async function handleSaveNotifs() {
    setSaving(true);
    try {
      await updateNotifPrefs(notifPrefs);
      setSaved(true);
      toast.success("Notification preferences saved");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      setPasswordMsg({
        type: "success",
        text: "Password changed successfully",
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setPasswordMsg({
        type: "error",
        text: e.message || "Failed to change password",
      });
      toast.error(e.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  async function handleStartTotp() {
    setSaving(true);
    try {
      const result = await startTotpSetup();
      setTotpSecret(result.secret);
      toast.success("Authenticator setup started");
    } catch (e: any) {
      toast.error(e.message || "Failed to start authenticator setup");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmTotp() {
    setSaving(true);
    try {
      await confirmTotpSetup(totpCode);
      setTotpEnabled(true);
      setTotpSecret("");
      setTotpCode("");
      toast.success("Authenticator enabled");
    } catch (e: any) {
      toast.error(e.message || "Invalid authenticator code");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisableTotp() {
    setSaving(true);
    try {
      await disableTotp();
      setTotpEnabled(false);
      setTotpSecret("");
      setTotpCode("");
      toast.success("Authenticator disabled");
    } catch (e: any) {
      toast.error(e.message || "Failed to disable authenticator");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="flex gap-6">
        <nav className="w-56 shrink-0 space-y-1">
          {sections.map((s) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-[#fd761a]/10 text-[#fd761a] shadow-sm"
                    : "text-[#64748b] hover:bg-white hover:text-[#0e212c]"
                }`}
              >
                <s.icon className="h-4 w-4" /> {s.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-6">
          {active === "profile" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={session?.user?.name || ""}
                    readOnly
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] bg-[#f8fafc] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">
                    Email
                  </label>
                  <input
                    type="text"
                    defaultValue={session?.user?.email || ""}
                    readOnly
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] bg-[#f8fafc] cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Profile information is managed by your system administrator.
              </p>
            </>
          )}

          {active === "notifications" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">
                Notification Preferences
              </h2>
              {loading ? (
                <p className="text-sm text-[#94a3b8]">Loading preferences...</p>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      key: "notifLowStock" as const,
                      label: "Low Stock Alerts",
                      desc: "Get email notified when stock is below threshold",
                    },
                    {
                      key: "notifDailySales" as const,
                      label: "Daily Sales Report",
                      desc: "Receive a daily summary of sales activity via email",
                    },
                    {
                      key: "notifTransaction" as const,
                      label: "Transaction Updates",
                      desc: "Email notifications for completed or failed transactions",
                    },
                  ].map((f) => (
                    <label
                      key={f.key}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={notifPrefs[f.key]}
                        onChange={(e) =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            [f.key]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-4 w-4 accent-[#fd761a]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#0e212c]">
                          {f.label}
                        </p>
                        <p className="text-xs text-[#94a3b8]">{f.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {active === "security" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 pr-10 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0e212c]"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0e212c]"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 pr-10 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0e212c]"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {passwordMsg && (
                  <p
                    className={`text-xs flex items-center gap-1 ${passwordMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {passwordMsg.type === "success" ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : null}
                    {passwordMsg.text}
                  </p>
                )}
                <div className="pt-4 border-t border-[#e2e8f0] space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[#0e212c]">
                      Authenticator App
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      Use a six-digit TOTP code during sign in.
                    </p>
                  </div>
                  {totpSecret && (
                    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-4">
                      <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                        Scan with Authenticator App
                      </p>
                      <div className="flex justify-center">
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt="TOTP QR Code"
                            className="w-48 h-48 rounded-lg border border-[#e2e8f0]"
                          />
                        ) : (
                          <div className="w-48 h-48 rounded-lg bg-[#e2e8f0] animate-pulse" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[#94a3b8]">
                          Or manually enter this secret key:
                        </p>
                        <p className="font-mono text-sm tracking-wider text-[#0e212c] bg-white rounded-md px-3 py-2 mt-1 border border-[#e2e8f0] select-all">
                          {totpSecret}
                        </p>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder="Enter six-digit code"
                        className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-center tracking-[0.3em] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    {!totpSecret && !totpEnabled && (
                      <button
                        type="button"
                        onClick={handleStartTotp}
                        disabled={saving}
                        className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#0e212c] hover:bg-[#f8fafc]"
                      >
                        Set Up Authenticator
                      </button>
                    )}
                    {totpSecret && (
                      <button
                        type="button"
                        onClick={handleConfirmTotp}
                        disabled={saving || !totpCode}
                        className="px-4 py-2 bg-[#fd761a] rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Confirm Code
                      </button>
                    )}
                    {totpEnabled && (
                      <button
                        type="button"
                        onClick={handleDisableTotp}
                        disabled={saving}
                        className="px-4 py-2 border border-rose-200 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Disable Authenticator
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {active === "appearance" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">
                Appearance
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    checked={theme === "light"}
                    onChange={() => setTheme("light")}
                    className="h-4 w-4 accent-[#fd761a]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#0e212c]">
                      Light Mode
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      Clean, bright interface
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    checked={theme === "dark"}
                    onChange={() => setTheme("dark")}
                    className="h-4 w-4 accent-[#fd761a]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#0e212c]">
                      Dark Mode
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      Reduced eye strain, industrial look
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#e2e8f0] flex justify-end">
            {active === "security" ? (
              <button
                onClick={handleChangePassword}
                disabled={
                  saving || !currentPassword || !newPassword || !confirmPassword
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}{" "}
                Change Password
              </button>
            ) : active === "notifications" ? (
              <button
                onClick={handleSaveNotifs}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98]"
              >
                <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Changes"}
              </button>
            ) : (
              <p className="text-xs text-[#94a3b8]">No changes to save</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
