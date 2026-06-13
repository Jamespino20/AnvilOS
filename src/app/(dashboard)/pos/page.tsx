/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { getProducts, getBuyers, getCategories } from "@/actions";
import { POSClient } from "./client";

export default async function POSPage() {
  let products: any[] = [], buyers: any[] = [], categories: any[] = [];
  try {
    [products, buyers, categories] = await Promise.all([
      getProducts({ status: "available" }),
      getBuyers(),
      getCategories(),
    ]);
  } catch {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[#0e212c]">Database Unavailable</p>
          <p className="text-sm text-[#94a3b8]">Please try again in a few moments.</p>
        </div>
      </div>
    );
  }
  return (
    <POSClient products={products} buyers={buyers} categories={categories} />
  );
}
