"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour
const WARNING_BEFORE = 60 * 1000; // warn 1 min before

export function InactivityGuard() {
  const [showWarning, setShowWarning] = useState(false);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
  }, []);

  useEffect(() => {
    let warnTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;

    function handleActivity() {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      setShowWarning(false);
      warnTimer = setTimeout(() => setShowWarning(true), INACTIVITY_TIMEOUT - WARNING_BEFORE);
      logoutTimer = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, INACTIVITY_TIMEOUT);
    }

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    events.forEach((e) => window.addEventListener(e, handleActivity));
    handleActivity();

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-md flex items-center justify-center" onClick={resetTimer}>
      <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-sm mx-4 p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
          <Clock className="h-7 w-7" />
        </div>
        <h3 className="font-semibold text-lg text-[#0e212c]">Session Expiring</h3>
        <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
          You have been inactive for nearly one hour. Your session will expire soon.
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { resetTimer(); signOut({ callbackUrl: "/login" }); }}
            className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
          <button onClick={resetTimer}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all active:scale-[0.98]">
            Stay Active
          </button>
        </div>
      </div>
    </div>
  );
}
