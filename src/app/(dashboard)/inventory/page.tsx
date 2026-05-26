/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

import { getProducts, getCategories, getSuppliers } from "@/actions";
import { InventoryClient } from "./client";
import { auth } from "@/lib/auth";

export default async function InventoryPage() {
  const session = await auth();
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
      role={(session?.user as any)?.role}
    />
  );
}
