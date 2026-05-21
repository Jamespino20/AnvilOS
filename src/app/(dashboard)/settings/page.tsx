/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: 
*/

"use client";

import { useState } from "react";
import { Bell, Shield, User, Palette, Save } from "lucide-react";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const [active, setActive] = useState("profile");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                  isActive
                    ? "bg-[#fd761a]/10 text-[#fd761a] shadow-sm"
                    : "text-[#64748b] hover:bg-white hover:text-[#0e212c]"
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
                {[{ label: "Full Name", placeholder: "John Doe" }, { label: "Email", placeholder: "john@example.com" }, { label: "Phone", placeholder: "+63 912 345 6789" }].map((f) => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium text-[#64748b] mb-1.5">{f.label}</label>
                    <input type="text" placeholder={f.placeholder} className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] bg-[#f8fafc] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all" />
                  </div>
                ))}
              </div>
            </>
          )}
          {active === "notifications" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { label: "Low Stock Alerts", desc: "Get notified when stock is below threshold" },
                  { label: "Daily Sales Report", desc: "Receive a daily summary of sales activity" },
                  { label: "Transaction Updates", desc: "Notifications for completed or failed transactions" },
                ].map((f) => (
                  <label key={f.label} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-[#fd761a]" />
                    <div>
                      <p className="text-sm font-medium text-[#0e212c]">{f.label}</p>
                      <p className="text-xs text-[#94a3b8]">{f.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
          {active === "security" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-1.5">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10 transition-all" />
                </div>
              </div>
            </>
          )}
          {active === "appearance" && (
            <>
              <h2 className="text-lg font-semibold text-[#0e212c]">Appearance</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                  <input type="radio" name="theme" defaultChecked className="h-4 w-4 accent-[#fd761a]" />
                  <div>
                    <p className="text-sm font-medium text-[#0e212c]">Light Mode</p>
                    <p className="text-xs text-[#94a3b8]">Clean, bright interface</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                  <input type="radio" name="theme" className="h-4 w-4 accent-[#fd761a]" />
                  <div>
                    <p className="text-sm font-medium text-[#0e212c]">Dark Mode</p>
                    <p className="text-xs text-[#94a3b8]">Reduced eye strain, industrial look</p>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#e2e8f0] flex justify-end">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-lg font-semibold text-sm shadow-lg shadow-[#fd761a]/20 hover:from-[#e56600] hover:to-[#d45d00] transition-all active:scale-[0.98]">
              <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
