import { getProducts, getCategories, getSuppliers } from "@/actions";
import { InventoryClient } from "./client";

export default async function InventoryPage() {
  const [products, categories, suppliers] = await Promise.all([
    getProducts({ status: "available" }),
    getCategories(),
    getSuppliers(),
  ]);

  return <InventoryClient products={products} categories={categories} suppliers={suppliers} />;
}
