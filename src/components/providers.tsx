/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        theme="light"
        toastOptions={{
          style: {
            borderRadius: "0px",
            border: "1px solid rgba(0,0,0,0.1)",
            fontFamily: "var(--font-inter)",
          },
        }}
      />
    </SessionProvider>
  );
}
