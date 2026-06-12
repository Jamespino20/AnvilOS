"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Settings as SettingsIcon, Save, Loader2, User, Moon, Sun, Key, Lock, Camera, Eye, EyeOff } from "lucide-react";
import { updateProfile, updatePassword, startTotpSetup, confirmTotpSetup, disableTotp } from "@/actions";
import { toast } from "sonner";
import QRCode from "qrcode";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [tab, setTab] = useState<"profile" | "password" | "security">("profile");

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // TOTP
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [settingUpTotp, setSettingUpTotp] = useState(false);
  const [verifyingTotp, setVerifyingTotp] = useState(false);
  const isTotpEnabled = (session?.user as any)?.totpEnabled;

  useEffect(() => {
    if (typeof document !== "undefined") {
      setDarkMode(document.documentElement.classList.contains("dark"));
      const sessionImg = (session?.user as any)?.imageUrl;
      if (sessionImg) {
        setProfileImage(sessionImg);
      } else {
        setProfileImage(null);
      }
    }
  }, [open, session?.user]);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("cwl-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cwl-theme", "light");
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfileImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), imageUrl: profileImage || undefined });
    await update({ name: name.trim(), imageUrl: profileImage || undefined });
    router.refresh();
    onClose();
    toast.success("Profile updated");
  } catch (e) {
    toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match"); return; }
    setChangingPw(true);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
    setPwError("");
    router.refresh();
    toast.success("Password changed");
  } catch (e: any) {
    toast.error(e.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  }

  async function handleToggleTotp() {
    if (isTotpEnabled) {
      if (!confirm("Are you sure you want to disable two-factor authentication?")) return;
      try {
        await disableTotp();
        await update();
        router.refresh();
        toast.success("2FA disabled");
      } catch (e: any) {
        toast.error(e.message || "Failed to disable 2FA");
      }
    } else {
      setSettingUpTotp(true);
      try {
        const { secret } = await startTotpSetup();
        setTotpSecret(secret);
        const otpPath = `otpauth://totp/AnvilOS:${session?.user?.email}?secret=${secret}&issuer=AnvilOS`;
        const url = await QRCode.toDataURL(otpPath);
        setQrCodeUrl(url);
      } catch (e: any) {
        toast.error(e.message || "Failed to start 2FA setup");
        setSettingUpTotp(false);
      }
    }
  }

  async function handleConfirmTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) return;
    setVerifyingTotp(true);
    try {
      await confirmTotpSetup(totpCode);
      await update();
      setTotpSecret(null);
      setTotpCode("");
      setQrCodeUrl(null);
      setSettingUpTotp(false);
      router.refresh();
      toast.success("2FA enabled successfully");
    } catch (e: any) {
      toast.error(e.message || "Invalid code");
    } finally {
      setVerifyingTotp(false);
    }
  }

  if (!open) return null;

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "password" as const, label: "Password", icon: Lock },
    { id: "security" as const, label: "Security", icon: Key },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-bold text-[#0e212c] flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-[#fd761a]" /> Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"><X className="h-5 w-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2e8f0] px-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                tab === t.id ? "border-[#fd761a] text-[#fd761a]" : "border-transparent text-[#94a3b8] hover:text-[#64748b]"
              }`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#fd761a] to-[#e56600] text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                    {(session?.user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-[#e2e8f0] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#f1f5f9] shadow-sm transition-colors">
                  <Camera className="h-3 w-3 text-[#64748b]" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div>
                <p className="font-semibold text-[#0e212c]">{session?.user?.name || "User"}</p>
                <p className="text-sm text-[#64748b]">{session?.user?.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Display Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#e2e8f0]">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="h-5 w-5 text-[#64748b]" /> : <Sun className="h-5 w-5 text-[#fd761a]" />}
                <div>
                  <p className="text-sm font-medium text-[#0e212c]">Dark Mode</p>
                  <p className="text-xs text-[#94a3b8]">Toggle dark theme</p>
                </div>
              </div>
              <button type="button" onClick={toggleDarkMode}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${darkMode ? "bg-[#fd761a]" : "bg-[#e2e8f0]"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${darkMode ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Close</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
              </button>
            </div>
          </form>
        )}

        {tab === "password" && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Current Password</label>
              <div className="relative">
                <input type={showCurrentPassword ? "text" : "password"} autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors">
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={newPassword} autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {pwError && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{pwError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all">Close</button>
              <button type="submit" disabled={changingPw}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {changingPw ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing...</> : <><Lock className="h-4 w-4" /> Change Password</>}
              </button>
            </div>
          </form>
        )}

        {tab === "security" && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#e2e8f0]">
              <div className="flex items-center gap-3">
                <Key className={`h-5 w-5 ${isTotpEnabled ? "text-[#fd761a]" : "text-[#94a3b8]"}`} />
                <div>
                  <p className="text-sm font-medium text-[#0e212c]">Two-Factor Auth</p>
                  <p className="text-xs text-[#94a3b8]">Secure your account with MFA</p>
                </div>
              </div>
              <button type="button" onClick={handleToggleTotp} disabled={settingUpTotp}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  isTotpEnabled ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-[#fd761a]/10 text-[#fd761a] hover:bg-[#fd761a]/20"
                }`}>
                {isTotpEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            {settingUpTotp && totpSecret && (
              <form onSubmit={handleConfirmTotp} className="space-y-4 p-4 bg-slate-50 rounded-lg border border-[#e2e8f0]">
                <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Setup Authentication</p>
                <div className="flex flex-col items-center gap-3 py-2">
                  {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 border-4 border-white rounded-lg shadow-md" />}
                  <div className="text-center">
                    <p className="text-xs text-[#64748b] mb-1">Scan QR or enter manually:</p>
                    <code className="text-sm font-mono font-bold text-[#0e212c] bg-white px-2 py-1 rounded border border-[#e2e8f0]">{totpSecret}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Verification Code</label>
                  <input maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-center font-mono tracking-widest text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setSettingUpTotp(false); setTotpSecret(null); }}
                    className="flex-1 py-2 text-xs font-semibold text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-white transition-colors">Cancel</button>
                  <button type="submit" disabled={verifyingTotp || totpCode.length !== 6}
                    className="flex-1 py-2 bg-[#fd761a] text-white text-xs font-bold rounded-lg shadow-md hover:bg-[#e56600] transition-colors flex items-center justify-center gap-2">
                    {verifyingTotp ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify & Enable"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




