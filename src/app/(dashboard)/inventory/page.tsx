/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 12, 2026
*/

import { getProducts, getAllCategories, getSuppliers, getBrands } from "@/actions";
import { InventoryClient } from "./client";
import { auth } from "@/lib/auth";

export default async function InventoryPage() {
  const session = await auth();
  const [products, categories, suppliers, brands] = await Promise.all([
    getProducts({ status: "available" }),
    getAllCategories(),
    getSuppliers(),
    getBrands(),
  ]);

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
