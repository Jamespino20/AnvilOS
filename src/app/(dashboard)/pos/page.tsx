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
  const [products, buyers, categories] = await Promise.all([
    getProducts({ status: "available" }),
    getBuyers(),
    getCategories(),
  ]);
  return (
    <POSClient products={products} buyers={buyers} categories={categories} />
  );
}
