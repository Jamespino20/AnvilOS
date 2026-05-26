/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

/**
 * Auth Group Layout
 * Forces light mode on all auth pages (login, register, forgot-password)
 * regardless of the user's dark mode preference set in the dashboard.
 *
 * Strategy: nest content inside a wrapper that removes the `dark` class
 * context by not being a descendant of `.dark`. Combined with explicit
 * `data-theme="light"` for future-proofing.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="light"
      style={
        {
          colorScheme: "light",
          // Reset CSS variables to light mode values so auth pages
          // always render with the light palette even if html has .dark
          "--background": "oklch(1 0 0)",
          "--foreground": "oklch(0.153 0.006 107.1)",
          "--card": "oklch(1 0 0)",
          "--card-foreground": "oklch(0.153 0.006 107.1)",
          "--primary": "oklch(0.241 0.038 250)",
          "--primary-foreground": "oklch(0.987 0.022 95.277)",
          "--secondary": "oklch(0.967 0.001 286.375)",
          "--secondary-foreground": "oklch(0.21 0.006 285.885)",
          "--muted": "oklch(0.966 0.005 106.5)",
          "--muted-foreground": "oklch(0.58 0.031 107.3)",
          "--accent": "oklch(0.67 0.22 45)",
          "--accent-foreground": "oklch(0.987 0.022 95.277)",
          "--border": "oklch(0.93 0.007 106.5)",
          "--input": "oklch(0.93 0.007 106.5)",
          "--ring": "oklch(0.67 0.22 45)",
          "--destructive": "oklch(0.577 0.245 27.325)",
          "--destructive-foreground": "oklch(1 0 0)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
