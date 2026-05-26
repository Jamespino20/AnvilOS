/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("cwl-theme") as "light" | "dark" | null;
    const next =
      stored ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        theme={theme}
        toastOptions={{
          style: {
            borderRadius: "4px",
            border: "1px solid rgba(0,0,0,0.1)",
            fontFamily: "var(--font-inter)",
          },
        }}
      />
    </SessionProvider>
  );
}
