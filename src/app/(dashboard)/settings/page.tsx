/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Shield, User, Palette, Save, Loader2, CheckCircle } from "lucide-react";
import { getNotifPrefs, updateNotifPrefs } from "@/actions/email";
import { updatePassword } from "@/actions";

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
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    await updateNotifPrefs(notifPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function handleChangePassword() {
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setPasswordMsg({ type: "error", text: e.message || "Failed to change password" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0e212c] tracking-tight">Settings</h1>
        <p className="text-sm text-[#64748b] mt-1">Manage your account and application preferences</p>
      </div>

      <div className="flex gap-6">
        <nav className="w-56 shrink-0 space-y-1">
          {sections.map((s) => {
            const isActive = active === s.id;
            return (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive ? "bg-[#fd761a]/10 text-[#fd761a] shadow-sm" : "text-[#64748b] hover:bg-white hover:text-[#0e212c]"
                }`}>
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
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">Full Name</label>
                  <input type="text" defaultValue={session?.user?.name || ""} readOnly
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] bg-[#f8fafc] cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">Email</label>
                  <input type="text" defaultValue={session?.user?.email || ""} readOnly
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] bg-[#f8fafc] cursor-not-allowed" />
                </div>
              </div>
              <p className="text-xs text-[#94a3b8]">Profile information is managed by your system administrator.</p>
            </>
          )}

          {active === "notifications" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">Notification Preferences</h2>
              {loading ? (
                <p className="text-sm text-[#94a3b8]">Loading preferences...</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: "notifLowStock" as const, label: "Low Stock Alerts", desc: "Get email notified when stock is below threshold" },
                    { key: "notifDailySales" as const, label: "Daily Sales Report", desc: "Receive a daily summary of sales activity via email" },
                    { key: "notifTransaction" as const, label: "Transaction Updates", desc: "Email notifications for completed or failed transactions" },
                  ].map((f) => (
                    <label key={f.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                      <input type="checkbox" checked={notifPrefs[f.key]}
                        onChange={(e) => setNotifPrefs((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 accent-[#fd761a]" />
                      <div>
                        <p className="text-sm font-medium text-[#0e212c]">{f.label}</p>
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
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all" />
                </div>
                {passwordMsg && (
                  <p className={`text-xs flex items-center gap-1 ${passwordMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                    {passwordMsg.type === "success" ? <CheckCircle className="h-3.5 w-3.5" /> : null}
                    {passwordMsg.text}
                  </p>
                )}
              </div>
            </>
          )}

          {active === "appearance" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">Appearance</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                  <input type="radio" name="theme" checked={theme === "light"} onChange={() => setTheme("light")} className="h-4 w-4 accent-[#fd761a]" />
                  <div>
                    <p className="text-sm font-medium text-[#0e212c]">Light Mode</p>
                    <p className="text-xs text-[#94a3b8]">Clean, bright interface</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                  <input type="radio" name="theme" checked={theme === "dark"} onChange={() => setTheme("dark")} className="h-4 w-4 accent-[#fd761a]" />
                  <div>
                    <p className="text-sm font-medium text-[#0e212c]">Dark Mode</p>
                    <p className="text-xs text-[#94a3b8]">Reduced eye strain, industrial look</p>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#e2e8f0] flex justify-end">
            {active === "security" ? (
              <button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98] disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Change Password
              </button>
            ) : active === "notifications" ? (
              <button onClick={handleSaveNotifs} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98]">
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
