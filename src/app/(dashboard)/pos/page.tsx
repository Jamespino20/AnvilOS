import { getProducts, getBuyers } from "@/actions";
import { POSClient } from "./client";

export default async function POSPage() {
  const [products, buyers] = await Promise.all([
    getProducts({ status: "available" }),
    getBuyers(),
  ]);
  return <POSClient products={products} buyers={buyers} />;
}
