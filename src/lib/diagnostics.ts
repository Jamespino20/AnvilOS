/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

/**
 * Diagnostic utility to capture hidden errors on Hostinger.
 * Import this at the very top of your entry-point files.
 */

if (typeof window === "undefined") {
  console.log("[DIAG] Initializing global error listeners...");

  process.on("unhandledRejection", (reason, promise) => {
    console.log("--------------------------------------------------");
    console.log("[CRITICAL] UNHANDLED REJECTION DETECTED");
    console.log("Reason:", reason);
    if (reason instanceof Error) {
      console.log("Stack:", reason.stack);
    }
    console.log("--------------------------------------------------");
  });

  process.on("uncaughtException", (error) => {
    console.log("--------------------------------------------------");
    console.log("[CRITICAL] UNCAUGHT EXCEPTION DETECTED");
    console.log("Error:", error.message);
    console.log("Stack:", error.stack);
    console.log("--------------------------------------------------");
    // We don't exit here so Hostinger's log has a chance to capture it
  });

  console.log("[DIAG] Listeners active. Monitoring process...");
}
