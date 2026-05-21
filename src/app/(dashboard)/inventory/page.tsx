/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

import { getProducts, getCategories, getSuppliers } from "@/actions";
import { InventoryClient } from "./client";

export default async function InventoryPage() {
  const [products, categories, suppliers] = await Promise.all([
    getProducts({ status: "available" }),
    getCategories(),
    getSuppliers(),
  ]);

  return (
    <InventoryClient
      products={products}
      categories={categories}
      suppliers={suppliers}
    />
  );
}
