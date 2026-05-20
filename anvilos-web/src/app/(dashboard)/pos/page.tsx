import { getProducts } from "@/actions";
import { POSClient } from "./client";

export default async function POSPage() {
  const products = await getProducts({ status: "available" });
  return <POSClient products={products} />;
}
