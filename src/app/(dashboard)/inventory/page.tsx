/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 11, 2026
*/

import {
  getProducts,
  getAllCategories,
  getSuppliers,
  getBrands,
} from "@/actions";
import { InventoryClient } from "./client";
import { auth } from "@/lib/auth";

export default async function InventoryPage() {
  const session = await auth();
  let products: any[] = [],
    categories: any[] = [],
    suppliers: any[] = [],
    brands: any[] = [];
  try {
    [products, categories, suppliers, brands] = await Promise.all([
      getProducts(),
      getAllCategories(),
      getSuppliers(),
      getBrands(),
    ]);
  } catch {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[#0e212c]">
            Database Unavailable
          </p>
          <p className="text-sm text-[#94a3b8]">
            Please try again in a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InventoryClient
      products={products}
      categories={categories}
      suppliers={suppliers}
      brands={brands}
      role={(session?.user as any)?.role}
    />
  );
}
