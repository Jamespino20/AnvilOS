/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use server";

import {
  Prisma,
  prisma,
  revalidatePath,
  revalidateTag,
  logAudit,
  auth,
  withTimeout,
  requireAdmin,
  formatMoney,
  actionFingerprint,
  DB_TIMEOUT,
  safeCall,
} from "./_shared";

// ─────────── Transactions ───────────

function buildTransactionWhere(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  const where: any = {};
  if (opts?.status) where.transactionStatus = opts.status;
  if (opts?.statusIn) where.transactionStatus = { in: opts.statusIn };
  if (opts?.type) where.transactionType = opts.type;
  if (opts?.paymentMethod) where.paymentMethod = opts.paymentMethod;
  if (opts?.startDate)
    where.transactionDate = { gte: new Date(opts.startDate) };
  if (opts?.endDate) {
    where.transactionDate = {
      ...where.transactionDate,
      lte: new Date(opts.endDate + "T23:59:59"),
    };
  }
  if (opts?.search) {
    const or: any[] = [
      { receiptNumber: { contains: opts.search } },
      { buyerName: { contains: opts.search } },
      { salesInvoiceNumber: { contains: opts.search } },
      { deliveryReceiptNumber: { contains: opts.search } },
    ];
    const num = parseInt(opts.search);
    if (!isNaN(num)) or.push({ receiptNumber: num });
    where.OR = or;
  }
  return where;
}

function buildTransactionSqlWhere(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  const clauses: Prisma.Sql[] = [];

  if (opts?.status) {
    clauses.push(Prisma.sql`TRANSACTION_STATUS = ${opts.status}`);
  }
  if (opts?.statusIn?.length) {
    clauses.push(
      Prisma.sql`TRANSACTION_STATUS IN (${Prisma.join(opts.statusIn)})`,
    );
  }
  if (opts?.type) {
    clauses.push(Prisma.sql`TRANSACTION_TYPE = ${opts.type}`);
  }
  if (opts?.paymentMethod) {
    clauses.push(Prisma.sql`PAYMENT_METHOD = ${opts.paymentMethod}`);
  }
  if (opts?.startDate) {
    clauses.push(Prisma.sql`TRANSACTION_DATE >= ${new Date(opts.startDate)}`);
  }
  if (opts?.endDate) {
    clauses.push(
      Prisma.sql`TRANSACTION_DATE <= ${new Date(opts.endDate + "T23:59:59")}`,
    );
  }
  if (opts?.search) {
    const textMatch = Prisma.sql`
      (BUYER_NAME COLLATE utf8mb4_unicode_ci LIKE
      CONCAT('%', CAST(${opts.search} AS CHAR CHARACTER SET utf8mb4), '%')
      COLLATE utf8mb4_unicode_ci
      OR SALES_INVOICE_NUMBER COLLATE utf8mb4_unicode_ci LIKE
      CONCAT('%', CAST(${opts.search} AS CHAR CHARACTER SET utf8mb4), '%')
      COLLATE utf8mb4_unicode_ci
      OR DELIVERY_RECEIPT_NUMBER COLLATE utf8mb4_unicode_ci LIKE
      CONCAT('%', CAST(${opts.search} AS CHAR CHARACTER SET utf8mb4), '%')
      COLLATE utf8mb4_unicode_ci
      OR CAST(RECEIPT_NUMBER AS CHAR) COLLATE utf8mb4_unicode_ci LIKE
      CONCAT('%', CAST(${opts.search} AS CHAR CHARACTER SET utf8mb4), '%')
      COLLATE utf8mb4_unicode_ci)
    `;
    clauses.push(textMatch);
  }

  return clauses;
}

function buildTransactionSqlWhereClause(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  const clauses = buildTransactionSqlWhere(opts);
  return clauses.length
    ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
    : Prisma.empty;
}

function transactionSortColumn(sortBy?: string) {
  switch (sortBy) {
    case "receiptNumber":
      return Prisma.sql`TRANSACTION_ID`;
    case "salesInvoiceNumber":
      return Prisma.sql`SALES_INVOICE_NUMBER`;
    case "deliveryReceiptNumber":
      return Prisma.sql`DELIVERY_RECEIPT_NUMBER`;
    case "buyerName":
      return Prisma.sql`BUYER_NAME`;
    case "transactionType":
      return Prisma.sql`TRANSACTION_TYPE`;
    case "transactionDate":
      return Prisma.sql`TRANSACTION_DATE`;
    case "paymentMethod":
      return Prisma.sql`PAYMENT_METHOD`;
    case "grandTotal":
      return Prisma.sql`GRAND_TOTAL`;
    case "transactionStatus":
      return Prisma.sql`TRANSACTION_STATUS`;
    case "sellerName":
      return Prisma.sql`SELLER_NAME`;
    case "isCredit":
      return Prisma.sql`IS_CREDIT`;
    default:
      return Prisma.sql`TRANSACTION_DATE`;
  }
}

export async function getTransactions(opts?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  perPage?: number;
  paymentMethod?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  try {
    if (opts?.search) {
      const take = opts?.perPage || 100;
      const skip = ((opts?.page || 1) - 1) * take;
      const where = buildTransactionSqlWhereClause(opts);
      const orderColumn = transactionSortColumn(opts?.sortBy);
      const orderDirection =
        opts?.sortDir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
      const [rows] = await Promise.all([
        prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
          SELECT TRANSACTION_ID AS id
          FROM transactions
          ${where}
          ORDER BY ${orderColumn} ${orderDirection}, TRANSACTION_ID DESC
          LIMIT ${take} OFFSET ${skip}
        `),
      ]);
      const ids = rows.map((row) => row.id);
      if (ids.length === 0) return [] as any[];
      const transactions = await prisma.transaction.findMany({
        where: { id: { in: ids } },
        include: { items: true, seller: { select: { sellerName: true } } },
      });
      const byId = new Map(transactions.map((txn) => [txn.id, txn]));
      return ids.map((id) => byId.get(id)).filter(Boolean) as any[];
    }

    const where = buildTransactionWhere(opts);
    const take = opts?.perPage || 100;
    const skip = ((opts?.page || 1) - 1) * take;

    return withTimeout(
      prisma.transaction.findMany({
        where,
        orderBy: opts?.sortBy
          ? { [opts.sortBy]: opts.sortDir || "desc" }
          : { transactionDate: "desc" },
        include: { items: true, seller: { select: { sellerName: true } } },
        skip,
        take,
      }),
      DB_TIMEOUT,
      "Loading transactions",
    );
  } catch {
    return [] as any[];
  }
}

export async function getTransactionsCount(opts?: {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMethod?: string;
}) {
  try {
    if (opts?.search) {
      const where = buildTransactionSqlWhereClause(opts);
      const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM transactions
        ${where}
      `);
      return Number(rows[0]?.count || 0);
    }

    const where = buildTransactionWhere(opts);
    return prisma.transaction.count({ where });
  } catch {
    return 0;
  }
}

export async function getTransaction(id: number) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      seller: { select: { sellerName: true } },
    },
  });
}

async function applyStockChanges(
  type:
    | "SaleWalkIn"
    | "SalePO"
    | "Restock"
    | "Adjustment"
    | "Return"
    | "Damage",
  items: { productId: number; quantity: number }[],
) {
  for (const item of items) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: item.productId },
    });
    let newQty = product.quantity;

    switch (type) {
      case "SaleWalkIn":
      case "Damage":
        newQty = product.quantity - item.quantity;
        if (newQty < 0)
          throw new Error(
            `Insufficient stock for "${product.productName}" (have ${product.quantity}, need ${item.quantity})`,
          );
        break;
      case "Return":
        newQty = product.quantity + item.quantity;
        break;
      case "Restock":
        // Stock increased only when processed via Restocks module
        break;
      case "Adjustment":
        newQty = item.quantity; // absolute override
        break;
      case "SalePO":
        // No stock change until completed via edit
        break;
    }

    await prisma.product.update({
      where: { id: item.productId },
      data: { quantity: newQty, isAvailable: newQty > 0 },
    });
  }
}

export async function createTransaction(data: {
  buyerName: string;
  buyerAddress?: string;
  buyerContact?: string;
  buyerEmail?: string;
  transactionType:
    | "SaleWalkIn"
    | "SalePO"
    | "Restock"
    | "Adjustment"
    | "Return"
    | "Damage";
  transactionStatus:
    | "Ongoing"
    | "Processing"
    | "OnTheWay"
    | "Completed"
    | "Cancelled";
  grandTotal: number;
  paymentMethod?: string;
  deliveryMethod?: "WalkIn" | "Pickup" | "Delivery" | "COD";
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costPrice?: number;
  }[];
  returnForReceiptNumber?: number;
  salesInvoiceNumber?: string;
  deliveryReceiptNumber?: string;
  tin?: string;
  isCredit?: boolean;
  creditDueDate?: Date;
  chequeDetails?: {
    chequeNumber?: string;
    bankName?: string;
    chequeDate?: Date;
    payeeName?: string;
  };
  discountType?: "amount" | "percent" | null;
  discountValue?: number | null;
  discountDesc?: string | null;
  additionalChargeType?: "amount" | "percent" | null;
  additionalChargeValue?: number | null;
  additionalChargeDesc?: string | null;
  transactionDate?: Date | string;
}) {
  return safeCall(async () => {
    const session = await auth();
    const sellerId = Number(session?.user?.id) || 0;
    const sellerName = session?.user?.name || "Unknown";

    const lastReceipt = await prisma.transaction.findFirst({
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
    });
    const receiptNumber = (lastReceipt?.receiptNumber ?? 1000) + 1;

    // Return validation
    if (data.transactionType === "Return" && data.returnForReceiptNumber) {
      const orig = await prisma.transaction.findFirst({
        where: { receiptNumber: data.returnForReceiptNumber },
        include: { items: true },
      });
      if (!orig) throw new Error("Original receipt not found");
      if (orig.isReturned)
        throw new Error("This receipt has already been returned");
      if (
        orig.transactionType !== "SaleWalkIn" &&
        orig.transactionType !== "SalePO"
      )
        throw new Error("Can only return Sale transactions");

      // Validate per-product return quantities
      for (const item of data.items) {
        const origItem = orig.items.find((i) => i.productId === item.productId);
        if (!origItem)
          throw new Error(`Product #${item.productId} not in original receipt`);

        const alreadyReturned = await prisma.transactionItem.aggregate({
          where: {
            productId: item.productId,
            transaction: {
              returnForReceiptNumber: data.returnForReceiptNumber,
              transactionType: "Return",
            },
          },
          _sum: { quantity: true },
        });
        const returnedQty = alreadyReturned._sum.quantity ?? 0;
        const maxReturnable = (origItem.quantity ?? 0) - returnedQty;
        if (item.quantity > maxReturnable)
          throw new Error(
            `Can only return ${maxReturnable} of "${origItem.productName}"`,
          );
      }
    }

    // Apply stock changes
    if (data.transactionStatus === "Completed") {
      await applyStockChanges(data.transactionType, data.items);
    }

    // Look up product names for transaction items
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productName: true },
    });
    const productNameMap = new Map(products.map((p) => [p.id, p.productName]));

    const itemsWithNames = data.items.map((i) => ({
      productId: i.productId,
      productName: productNameMap.get(i.productId) || `Product #${i.productId}`,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      costPrice: i.costPrice,
    }));

    const transaction = await withTimeout(
      prisma.transaction.create({
        data: {
          receiptNumber,
          buyerName: data.buyerName,
          buyerAddress: data.buyerAddress || "",
          buyerContact: data.buyerContact || "",
          sellerId: sellerId || undefined,
          sellerName,
          transactionType: data.transactionType,
          deliveryMethod: data.deliveryMethod || "WalkIn",
          paymentMethod: data.paymentMethod || undefined,
          transactionStatus: data.transactionStatus,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          grandTotal: data.grandTotal,
          returnForReceiptNumber: data.returnForReceiptNumber,
          salesInvoiceNumber: data.salesInvoiceNumber,
          deliveryReceiptNumber: data.deliveryReceiptNumber,
          tin: data.tin,
          isCredit: data.isCredit || false,
          creditDueDate: data.creditDueDate,
          chequeNumber: data.chequeDetails?.chequeNumber || undefined,
          chequeBankName: data.chequeDetails?.bankName || undefined,
          chequeDate: data.chequeDetails?.chequeDate || undefined,
          chequePayeeName: data.chequeDetails?.payeeName || undefined,
          isReturned: data.transactionType === "Return",
          discountType: data.discountType || null,
          discountValue: data.discountValue ?? null,
          discountDesc: data.discountDesc || null,
          additionalChargeType: data.additionalChargeType || null,
          additionalChargeValue: data.additionalChargeValue ?? null,
          additionalChargeDesc: data.additionalChargeDesc || null,
          items: { create: itemsWithNames },
        },
      }),
      DB_TIMEOUT,
      "Processing transaction",
    );

    // Upsert buyer record (skip for internal/Restock — CWL Hardware names)
    let buyer: { id: number; email: string | null } | null = null;
    if (
      data.buyerName &&
      data.transactionType !== "Restock" &&
      !data.buyerName.startsWith("CWL Hardware")
    ) {
      buyer = await prisma.buyer.findFirst({
        where: { name: data.buyerName },
      });

      // Returns decrement totalSpent (refund), Damage/Adjustment don't affect it
      // SalePO skips totalSpent at creation — only incremented on completion
      const isReturn = data.transactionType === "Return";
      const isNonMonetary =
        data.transactionType === "Damage" ||
        data.transactionType === "Adjustment";
      const isSalePO = data.transactionType === "SalePO";
      const skipTotalSpent = isNonMonetary || isSalePO;

      if (buyer) {
        buyer = await prisma.buyer.update({
          where: { id: buyer.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: skipTotalSpent
              ? undefined
              : isReturn
                ? { decrement: data.grandTotal }
                : { increment: data.grandTotal },
            address: data.buyerAddress || undefined,
            phone: data.buyerContact || undefined,
            email: data.buyerEmail || undefined,
            tin: data.tin || undefined,
            sellerId: sellerId || undefined,
          },
        });
      } else {
        buyer = await prisma.buyer.create({
          data: {
            name: data.buyerName,
            address: data.buyerAddress || null,
            phone: data.buyerContact || null,
            email: data.buyerEmail || null,
            tin: data.tin || null,
            totalOrders: 1,
            totalSpent: skipTotalSpent
              ? 0
              : isReturn
                ? -data.grandTotal
                : data.grandTotal,
            sellerId: sellerId || undefined,
          },
        });
      }
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { buyerId: buyer.id },
      });
    }
    // For credit sales, update buyer's credit balance (decrement for returns)
    if (data.isCredit && buyer) {
      const isReturn = data.transactionType === "Return";
      await prisma.buyer.update({
        where: { id: buyer.id },
        data: {
          creditBalance: isReturn
            ? { decrement: data.grandTotal }
            : { increment: data.grandTotal },
        },
      });
    }

    // For Restock, still link the transaction if a "CWL Hardware" buyer already exists
    if (data.transactionType === "Restock" && data.buyerName) {
      const existing = await prisma.buyer.findFirst({
        where: { name: data.buyerName },
      });
      if (existing) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { buyerId: existing.id },
        });
      }
    }

    const isBackdated = data.transactionDate && new Date(data.transactionDate).toDateString() !== new Date().toDateString();
    const auditDetails = isBackdated
      ? `${data.transactionType} #${receiptNumber} - ${data.buyerName} - ${formatMoney(data.grandTotal)} (Backdated: ${new Date(data.transactionDate!).toLocaleDateString()})`
      : `${data.transactionType} #${receiptNumber} - ${data.buyerName} - ${formatMoney(data.grandTotal)}`;
    
    await logAudit(
      "POSPanel",
      "Complete Transaction",
      auditDetails,
      true,
      undefined,
      isBackdated ? { transactionDate: new Date().toISOString() } : undefined,
      isBackdated ? { transactionDate: new Date(data.transactionDate!).toISOString() } : undefined,
    );

    // Fire-and-forget email alerts (non-blocking)
    if (data.transactionStatus === "Completed") {
      const actor = actionFingerprint(session);
      import("@/actions/email")
        .then((m) => {
          // 1. Check stock alerts
          m.checkAndAlertLowStock().catch((e) =>
            console.error("Low stock alert failed:", e),
          );

          // 2. Alert staff (systemwide)
          m.sendSystemTransactionAlert(
            receiptNumber,
            data.buyerName,
            data.grandTotal,
            actor,
          ).catch((e) => console.error("System transaction alert failed:", e));

          // 3. Email buyer (receipt)
          if (buyer?.email) {
            m.sendTransactionReceipt(
              receiptNumber,
              data.buyerName,
              buyer.email,
              itemsWithNames.map((i) => ({
                productName: i.productName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
              })),
              data.grandTotal,
              actor,
              data.paymentMethod,
              data.discountType,
              data.discountValue,
              data.discountDesc,
              data.additionalChargeType,
              data.additionalChargeValue,
              data.additionalChargeDesc,
            ).catch((e) => console.error("Buyer receipt email failed:", e));
          }
        })
        .catch((e) => console.error("Failed to load email actions:", e));
    }

    revalidatePath("/transactions");
    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidateTag("buyers", "default");
    return transaction;
  });
}

export async function getDeliverers() {
  const result = await prisma.transaction.findMany({
    where: { delivererName: { not: null } },
    select: { delivererName: true },
    distinct: ["delivererName"],
    orderBy: { delivererName: "asc" },
  });
  return result.map((r) => r.delivererName!);
}

export async function getReturnTransaction(receiptNumber: number) {
  return safeCall(async () => {
    console.log(
      `[getReturnTransaction] lookup receiptNumber=${receiptNumber} (type=${typeof receiptNumber})`,
    );
    const txn = await prisma.transaction.findFirst({
      where: { receiptNumber },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    console.log(
      `[getReturnTransaction] result=${txn ? `found id=${txn.id} type=${txn.transactionType} items=${txn.items.length}` : "null"}`,
    );
    if (!txn) throw new Error(`Receipt #${receiptNumber} not found`);
    if (
      txn.transactionType === "Return" ||
      txn.transactionType === "Damage" ||
      txn.transactionType === "Adjustment"
    )
      throw new Error("Cannot reference another Return/Damage/Adjustment");
    return {
      buyerName: txn.buyerName,
      tin: txn.tin,
      items: txn.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
        product: i.product
          ? {
              id: i.product.id,
              productName: i.product.productName,
              sellingPrice: Number(i.product.sellingPrice),
              quantity: i.product.quantity,
            }
          : {
              id: i.productId ?? 0,
              productName: i.productName,
              sellingPrice: Number(i.unitPrice),
              quantity: 0,
            },
      })),
    };
  });
}

export async function updateTransactionInvoice(
  id: number,
  field: "salesInvoiceNumber" | "deliveryReceiptNumber",
  value: string,
) {
  await requireAdmin();
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    select: { receiptNumber: true },
  });
  await prisma.transaction.update({
    where: { id },
    data: { [field]: value || null },
  });
  const label =
    field === "salesInvoiceNumber" ? "Sales Invoice" : "Delivery Receipt";
  await logAudit(
    "Transactions",
    "Update Invoice",
    `#${txn.receiptNumber}: ${label} set to "${value}"`,
  );
  revalidatePath("/transactions");
}

export async function updateTransactionStatus(
  id: number,
  status: "Ongoing" | "Processing" | "OnTheWay" | "Completed" | "Cancelled",
  deliveryData?: {
    deliveryRef?: string;
    deliveryNotes?: string;
    delivererName?: string;
  },
) {
  await requireAdmin();
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    include: { items: true },
  });

  // If completing a Sale PO, deduct stock and record totalSpent
  if (
    status === "Completed" &&
    txn.transactionStatus !== "Completed" &&
    txn.transactionType === "SalePO"
  ) {
    await applyStockChanges(
      "SaleWalkIn",
      txn.items.map((i) => ({
        productId: i.productId!,
        quantity: i.quantity!,
      })),
    );
    // Increment buyer totalSpent now that money is received
    if (txn.buyerName) {
      const buyer = await prisma.buyer.findFirst({
        where: { name: txn.buyerName },
      });
      if (buyer) {
        await prisma.buyer.update({
          where: { id: buyer.id },
          data: {
            totalSpent: { increment: Number(txn.grandTotal) },
          },
        });
      }
    }
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      transactionStatus: status,
      ...(deliveryData?.deliveryRef !== undefined && {
        deliveryRef: deliveryData.deliveryRef,
      }),
      ...(deliveryData?.deliveryNotes !== undefined && {
        deliveryNotes: deliveryData.deliveryNotes,
      }),
      ...(deliveryData?.delivererName !== undefined && {
        delivererName: deliveryData.delivererName,
      }),
    },
  });

  // If cancelling a Return, reverse the totalSpent decrement (refund undone)
  if (
    status === "Cancelled" &&
    txn.transactionStatus !== "Cancelled" &&
    txn.transactionType === "Return" &&
    txn.buyerName
  ) {
    const buyer = await prisma.buyer.findFirst({
      where: { name: txn.buyerName },
    });
    if (buyer) {
      await prisma.buyer.update({
        where: { id: buyer.id },
        data: {
          totalSpent: { increment: Number(txn.grandTotal) },
          totalOrders: { decrement: 1 },
        },
      });
    }
  }

  await logAudit(
    "EditTransactionDialog",
    "Update Status",
    `#${txn.receiptNumber}: ${txn.transactionStatus} → ${status}`,
  );
  revalidatePath("/transactions");
  revalidatePath("/pos");

  // Trigger alerts if now completed
  if (status === "Completed") {
    import("@/actions/email")
      .then((m) => m.checkAndAlertLowStock())
      .catch((e) => console.error("Low stock alert failed:", e));
  }

  return updated;
}

export async function updateTransaction(
  id: number,
  data: {
    buyerName?: string;
    buyerAddress?: string;
    buyerContact?: string;
    deliveryRef?: string;
    deliveryNotes?: string;
    delivererName?: string;
    transactionStatus?:
      | "Ongoing"
      | "Processing"
      | "OnTheWay"
      | "Completed"
      | "Cancelled";
    isCredit?: boolean;
    creditDueDate?: string | null;
    items?: {
      id?: number;
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  },
) {
  return safeCall(async () => {
    await requireAdmin();
    const txn = await prisma.transaction.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });
    const oldItems = [...txn.items];

    // Update header
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        buyerName: data.buyerName,
        buyerAddress: data.buyerAddress,
        buyerContact: data.buyerContact,
        deliveryRef: data.deliveryRef,
        deliveryNotes: data.deliveryNotes,
        delivererName: data.delivererName,
        transactionStatus: data.transactionStatus,
        isCredit: data.isCredit,
        creditDueDate: data.creditDueDate
          ? new Date(data.creditDueDate)
          : undefined,
      },
    });

    // If items changed, recalculate stock deltas
    if (data.items) {
      const prodIds = [...new Set(data.items.map((i) => i.productId))];
      const prods = await prisma.product.findMany({
        where: { id: { in: prodIds } },
        select: { id: true, productName: true },
      });
      const nameMap = new Map(prods.map((p) => [p.id, p.productName]));
      const itemsWithNames = data.items.map((i) => ({
        productId: i.productId,
        productName: nameMap.get(i.productId) || `Product #${i.productId}`,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        transactionId: id,
      }));

      await prisma.transactionItem.deleteMany({ where: { transactionId: id } });
      await prisma.transactionItem.createMany({ data: itemsWithNames });

      // Recalculate stock based on delta between old and new items
      for (const newItem of data.items) {
        const oldItem = oldItems.find((o) => o.productId === newItem.productId);
        const oldQty = oldItem?.quantity ?? 0;
        const product = await prisma.product.findUniqueOrThrow({
          where: { id: newItem.productId },
        });
        let delta = 0;

        switch (txn.transactionType) {
          case "Restock":
          case "Return":
            delta = newItem.quantity - oldQty;
            break;
          case "Damage":
          case "SaleWalkIn":
            delta = oldQty - newItem.quantity;
            break;
          case "Adjustment":
            delta = newItem.quantity - product.quantity;
            break;
          case "SalePO":
            delta = 0;
            if (data.transactionStatus === "Completed")
              delta = -newItem.quantity;
            break;
        }

        const newStock = product.quantity + delta;
        if (newStock < 0)
          throw new Error(`Insufficient stock for #${newItem.productId}`);
        await prisma.product.update({
          where: { id: newItem.productId },
          data: { quantity: newStock, isAvailable: newStock > 0 },
        });

        await logAudit(
          "EditTransactionDialog",
          txn.transactionType,
          `${product.productName} (#${txn.receiptNumber}): ${oldQty}→${newItem.quantity} (delta:${delta})`,
        );
      }
    }

    await logAudit(
      "EditTransactionDialog",
      "Edit Transaction",
      `#${txn.receiptNumber} updated`,
    );
    revalidatePath("/transactions");
    return updated;
  });
}

export async function markCreditAsPaid(id: number) {
  return safeCall(async () => {
    await requireAdmin();
    const txn = await prisma.transaction.findUniqueOrThrow({ where: { id } });
    if (!txn.isCredit) throw new Error("Transaction is not a credit sale");
    if (txn.creditPaidAt) throw new Error("Credit is already marked as paid");
    const updated = await prisma.transaction.update({
      where: { id },
      data: { creditPaidAt: new Date() },
    });
    await logAudit(
      "Transactions",
      "Mark Credit Paid",
      `#${txn.receiptNumber} credit marked as paid`,
    );
    revalidatePath("/transactions");
    return updated;
  });
}

export async function recordCreditPayment(
  id: number,
  amountPaid: number,
  penaltyFee: number = 0,
) {
  return safeCall(async () => {
    await requireAdmin();
    const txn = await prisma.transaction.findUniqueOrThrow({ where: { id } });
    if (!txn.isCredit) throw new Error("Transaction is not a credit sale");

    const grandTotal = Number(txn.grandTotal);
    const currentAmountPaid = Number(txn.creditAmountPaid);
    const currentPenaltyFee = Number(txn.creditPenaltyFee);

    if (amountPaid <= 0) throw new Error("Payment amount must be greater than 0");
    if (currentAmountPaid >= grandTotal) throw new Error("Credit is already fully paid");

    const totalOwed = grandTotal + currentPenaltyFee;
    const remaining = totalOwed - currentAmountPaid;
    if (amountPaid > remaining) {
      throw new Error(`Payment exceeds remaining balance of ${remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`);
    }

    const newAmountPaid = currentAmountPaid + amountPaid;
    const newPenaltyFee = currentPenaltyFee + penaltyFee;
    const isFullyPaid = newAmountPaid >= grandTotal;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        creditAmountPaid: newAmountPaid,
        creditPenaltyFee: newPenaltyFee,
        creditLastPaymentDate: new Date(),
        creditPaidAt: isFullyPaid ? new Date() : null,
      },
    });

    // Update buyer's creditBalance
    if (txn.buyerName) {
      const buyer = await prisma.buyer.findFirst({ where: { name: txn.buyerName } });
      if (buyer) {
        const paymentApplied = amountPaid + penaltyFee;
        await prisma.buyer.update({
          where: { id: buyer.id },
          data: { creditBalance: { decrement: paymentApplied } },
        });
      }
    }

    await logAudit(
      "Transactions",
      "Record Credit Payment",
      `#${txn.receiptNumber} - Paid ${amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}${penaltyFee > 0 ? ` + ${penaltyFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })} penalty` : ""}${isFullyPaid ? " (Fully Paid)" : ` (Remaining: ${(totalOwed - newAmountPaid).toLocaleString("en-PH", { minimumFractionDigits: 2 })})`}`,
    );
    revalidatePath("/transactions");
    return updated;
  });
}

export async function toggleTransactionCredit(
  id: number,
  isCredit: boolean,
  creditDueDate?: string | null,
) {
  return safeCall(async () => {
    await requireAdmin();
    const txn = await prisma.transaction.findUniqueOrThrow({ where: { id } });
    if (isCredit === txn.isCredit && creditDueDate === undefined) {
      return txn;
    }
    if (
      ["Return", "Restock", "Damage", "Adjustment"].includes(
        txn.transactionType,
      )
    ) {
      throw new Error("Credit can only be toggled on Sale transactions");
    }
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        isCredit,
        creditDueDate:
          creditDueDate !== undefined
            ? creditDueDate
              ? new Date(creditDueDate)
              : null
            : isCredit
              ? txn.creditDueDate
              : null,
      },
    });
    // Adjust buyer creditBalance
    if (txn.buyerName) {
      const buyer = await prisma.buyer.findFirst({
        where: { name: txn.buyerName },
      });
      if (buyer) {
        const amount = Number(txn.grandTotal || 0);
        if (isCredit && !txn.isCredit) {
          // Toggling ON: increment creditBalance
          await prisma.buyer.update({
            where: { id: buyer.id },
            data: { creditBalance: { increment: amount } },
          });
        } else if (!isCredit && txn.isCredit) {
          // Toggling OFF: decrement creditBalance
          await prisma.buyer.update({
            where: { id: buyer.id },
            data: { creditBalance: { decrement: amount } },
          });
        }
      }
    }
    await logAudit(
      "Transactions",
      isCredit ? "Mark as Credit" : "Remove Credit",
      `#${txn.receiptNumber} credit ${isCredit ? "enabled" : "removed"}`,
    );
    revalidatePath("/transactions");
    return updated;
  });
}

export async function getDailySales(date?: string) {
  const start = date ? new Date(date) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const result = await prisma.transaction.aggregate({
    where: {
      transactionDate: { gte: start, lt: end },
      transactionType: { in: ["SaleWalkIn", "SalePO"] },
      transactionStatus: "Completed",
    },
    _sum: { grandTotal: true },
    _count: true,
  });

  return { total: result._sum.grandTotal || 0, count: result._count };
}

export async function getRevenueTrend(days: number = 7) {
  const data: { date: string; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const { total } = await getDailySales(d.toISOString().split("T")[0]);
    data.push({
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: Number(total),
    });
  }
  return data;
}
