/*
App Name: AnvilOS
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 21, 2026 
*/

import { getProducts, getBuyers } from "@/actions";
import { POSClient } from "./client";

export default async function POSPage() {
  const [products, buyers] = await Promise.all([
    getProducts({ status: "available" }),
    getBuyers(),
  ]);
  return <POSClient products={products} buyers={buyers} />;
}
