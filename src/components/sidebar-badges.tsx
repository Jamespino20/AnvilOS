/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 7, 2026
*/

"use client";

import { useState, useEffect, useCallback } from "react";
import { getDashboardKpis, getTransactionsCount } from "@/actions";

export function useSidebarBadges() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingRestockCount, setPendingRestockCount] = useState(0);
  const [pendingPOCount, setPendingPOCount] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const kpis = await getDashboardKpis();
      setLowStockCount(kpis.lowStockCount);
    } catch {}
    try {
      const count = await getTransactionsCount({
        status: "Ongoing",
        type: "Restock",
      });
      setPendingRestockCount(count);
    } catch {}
    try {
      const count = await getTransactionsCount({
        status: "Processing",
        type: "SalePO",
      });
      setPendingPOCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 10000);
    const onFocus = () => fetch();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") fetch();
    });
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetch]);

  return { lowStockCount, pendingRestockCount, pendingPOCount };
}
