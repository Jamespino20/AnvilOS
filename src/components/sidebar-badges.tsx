"use client";

import { useState, useEffect } from "react";
import { getDashboardKpis, getTransactionsCount } from "@/actions";

export function useSidebarBadges() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingRestockCount, setPendingRestockCount] = useState(0);

  useEffect(() => {
    async function fetch() {
      try {
        const kpis = await getDashboardKpis();
        setLowStockCount(kpis.lowStockCount);
      } catch {}
      try {
        const count = await getTransactionsCount({ status: "Ongoing", type: "Restock" });
        setPendingRestockCount(count);
      } catch {}
    }
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  return { lowStockCount, pendingRestockCount };
}
