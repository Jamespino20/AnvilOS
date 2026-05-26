export const IMPORT_CONFIGS: Record<string, { label: string; columns: { key: string; label: string; type: "string" | "number" | "date" | "boolean"; required?: boolean; enum?: string[] }[] }> = {
  products: {
    label: "Products",
    columns: [
      { key: "productName", label: "Product Name", type: "string", required: true },
      { key: "category", label: "Category", type: "string", required: true },
      { key: "supplierName", label: "Supplier Name", type: "string" },
      { key: "unitPrice", label: "Unit Price", type: "number", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "minThreshold", label: "Min Threshold", type: "number", required: true },
      { key: "imageUrl", label: "Image URL", type: "string" },
    ],
  },
  inventory: {
    label: "Inventory",
    columns: [
      { key: "productName", label: "Product Name", type: "string", required: true },
      { key: "category", label: "Category", type: "string" },
      { key: "supplierName", label: "Supplier Name", type: "string" },
      { key: "unitPrice", label: "Unit Price", type: "number", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "minThreshold", label: "Min Threshold", type: "number" },
    ],
  },
  transactions: {
    label: "Transactions",
    columns: [
      { key: "receiptNumber", label: "Receipt #", type: "number", required: true },
      { key: "buyerName", label: "Buyer Name", type: "string", required: true },
      { key: "transactionType", label: "Transaction Type", type: "string", required: true, enum: ["SaleWalkIn", "SalePO", "Return", "Restock", "Adjustment", "Damage"] },
      { key: "grandTotal", label: "Grand Total", type: "number" },
      { key: "paymentMethod", label: "Payment Method", type: "string" },
      { key: "deliveryMethod", label: "Delivery Method", type: "string", enum: ["Pickup", "Delivery", "COD", "WalkIn"] },
      { key: "transactionStatus", label: "Status", type: "string", enum: ["Completed", "Ongoing", "Cancelled"] },
      { key: "transactionDate", label: "Date", type: "date" },
    ],
  },
  buyers: {
    label: "Buyers",
    columns: [
      { key: "buyerName", label: "Buyer Name", type: "string", required: true },
      { key: "buyerAddress", label: "Address", type: "string" },
      { key: "buyerContact", label: "Contact", type: "string" },
      { key: "totalOrders", label: "Total Orders", type: "number" },
      { key: "totalSpent", label: "Total Spent", type: "number" },
    ],
  },
  suppliers: {
    label: "Suppliers",
    columns: [
      { key: "supplierName", label: "Supplier Name", type: "string", required: true },
      { key: "contactName", label: "Contact Person", type: "string" },
      { key: "contactNumber", label: "Contact Number", type: "string" },
      { key: "email", label: "Email", type: "string" },
      { key: "address", label: "Address", type: "string" },
    ],
  },
};

export function getImportConfig(table: string) {
  return IMPORT_CONFIGS[table] || null;
}




