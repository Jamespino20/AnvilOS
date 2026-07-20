/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  Package,
  RotateCcw,
  AlertTriangle,
  CreditCard,
  Truck,
  X,
  Pencil,
  FolderPlus,
  Receipt,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createTransaction, getReturnTransaction } from "@/actions";
import { callAction } from "@/lib/client-action";
import { PageHeader } from "@/components/ui/page-header";
import { downloadReceipt, downloadReceiptPdf } from "@/lib/receipt";
import { toast } from "sonner";
import type { Product } from "@prisma/client";

interface BuyerInfo {
  buyerName: string;
  buyerAddress?: string | null;
  buyerContact?: string | null;
  buyerEmail?: string | null;
  tin?: string | null;
}

type CategoryWithChildren = {
  id: number;
  name: string;
  parentCategoryId: number | null;
  _count?: { products: number };
};

interface Props {
  products: Product[];
  buyers: BuyerInfo[];
  categories: CategoryWithChildren[];
  suppliers: { id: number; supplierName: string }[];
  brands: { id: number; name: string }[];
  pendingPOQty?: Record<number, number>;
}

interface CartItem {
  product: Product;
  quantity: number;
  originalQty?: number;
}

const PAYMENT_METHODS = ["Cash", "Credit"];
const DELIVERY_METHODS = ["WalkIn", "Pickup", "Delivery", "COD"];

const TXN_TYPES = [
  { value: "SaleWalkIn" as const, label: "Sale Walk-In", icon: ShoppingCart },
  { value: "SalePO" as const, label: "Sale P.O.", icon: Package },
  { value: "Return" as const, label: "Return", icon: RotateCcw },
  { value: "Damage" as const, label: "Damage", icon: AlertTriangle },
  { value: "Adjustment" as const, label: "Adjustment", icon: Package },
];

export function POSClient({
  products,
  buyers,
  categories,
  suppliers,
  brands,
  pendingPOQty = {},
}: Props) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [parentCategory, setParentCategory] = useState<number | "">("");
  const [filterSupplier, setFilterSupplier] = useState<number | "">("");
  const [filterBrand, setFilterBrand] = useState<number | "">("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [txnType, setTxnType] =
    useState<(typeof TXN_TYPES)[number]["value"]>("SaleWalkIn");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [deliveryMethod, setDeliveryMethod] = useState("WalkIn");
  const [returnReceipt, setReturnReceipt] = useState("");
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [salesInvoiceNumber, setSalesInvoiceNumber] = useState("");
  const [deliveryReceiptNumber, setdeliveryReceiptNumber] = useState("");
  const [tin, setTin] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [creditDueDate, setCreditDueDate] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [done, setDone] = useState<{
    receipt: number;
    items: any[];
    buyerName: string;
    grandTotal: number;
    salesInvoiceNumber?: string;
    deliveryReceiptNumber?: string;
    tin?: string;
    isCredit?: boolean;
    creditDueDate?: Date;
    chequeDetails?: {
      chequeNumber: string;
      bankName: string;
      chequeDate?: Date;
      payeeName: string;
    };
    discountType?: string;
    discountValue?: number;
    additionalChargeType?: string;
    additionalChargeValue?: number;
    additionalChargeDesc?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [editingQty, setEditingQty] = useState<number | null>(null);
  const [qtyInput, setQtyInput] = useState("");
  const [cartWidth, setCartWidth] = useState(550);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [discountType, setDiscountType] = useState<"amount" | "percent" | "">(
    "",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [additionalChargeType, setAdditionalChargeType] = useState<
    "amount" | "percent" | ""
  >("");
  const [additionalChargeValue, setAdditionalChargeValue] = useState("");
  const [additionalChargeDesc, setAdditionalChargeDesc] = useState("");

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = cartWidth;

    const handleMouseMove = (me: MouseEvent) => {
      const diff = startX - me.clientX;
      const newWidth = Math.min(Math.max(startWidth + diff, 280), 550);
      setCartWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const buyerSuggestions = useMemo(
    () =>
      buyers.filter((b) =>
        b.buyerName.toLowerCase().includes(buyerName.toLowerCase()),
      ),
    [buyerName, buyers],
  );

  const parentCategories = categories;

  const filtered = products.filter((p) => {
    const effectiveQty = p.quantity - (pendingPOQty[p.id] || 0);
    if (effectiveQty <= 0) return false;
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterSupplier !== "" && p.supplierId !== filterSupplier) return false;
    if (filterBrand !== "" && (p as any).brandId !== filterBrand) return false;
    if (parentCategory !== "" && p.categoryId !== parentCategory) return false;
    return true;
  });

  function categoryDisplay(product: Product): string {
    if (!product.categoryId) return product.category || "";
    const cat = categories.find((c) => c.id === product.categoryId);
    return cat?.name || product.category || "";
  }

  function addToCart(product: Product) {
    const effectiveQty = product.quantity - (pendingPOQty[product.id] || 0);
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        const maxQty =
          txnType === "Return"
            ? existing.originalQty || product.quantity
            : effectiveQty;
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: Math.min(c.quantity + 1, maxQty) }
            : c,
        );
      }
      const maxInit =
        txnType === "Return" ? 0 : Math.min(1, effectiveQty || 0) || 1;
      return [...prev, { product, quantity: maxInit }];
    });
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          const effectiveQty =
            c.product.quantity - (pendingPOQty[c.product.id] || 0);
          const maxQty =
            txnType === "Return"
              ? c.originalQty || c.product.quantity
              : effectiveQty;
          return c.product.id === productId
            ? {
                ...c,
                quantity: Math.min(Math.max(0, c.quantity + delta), maxQty),
              }
            : c;
        })
        .filter((c) => c.quantity > 0),
    );
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  function setCartQty(productId: number, qty: number) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const effectiveQty =
          c.product.quantity - (pendingPOQty[c.product.id] || 0);
        const maxQty =
          txnType === "Return"
            ? c.originalQty || c.product.quantity
            : effectiveQty;
        const minQty = txnType === "Return" ? 0 : 1;
        return { ...c, quantity: Math.min(Math.max(minQty, qty), maxQty) };
      }),
    );
  }

  function startQtyEdit(productId: number, currentQty: number) {
    setEditingQty(productId);
    setQtyInput(String(currentQty));
  }

  function commitQtyEdit(productId: number) {
    const val = parseInt(qtyInput, 10);
    const minVal = txnType === "Return" ? 0 : 1;
    if (!isNaN(val) && val >= minVal) setCartQty(productId, val);
    setEditingQty(null);
    setQtyInput("");
  }

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, c) => sum + Number(c.product.sellingPrice) * c.quantity,
        0,
      ),
    [cart],
  );

  const discountAmount = useMemo(() => {
    if (!discountType || !discountValue) return 0;
    const val = Number(discountValue);
    if (isNaN(val) || val < 0) return 0;
    if (discountType === "percent") {
      return Math.min(subtotal * (val / 100), subtotal);
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountType, discountValue]);

  const additionalChargeAmount = useMemo(() => {
    if (!additionalChargeType || !additionalChargeValue) return 0;
    const val = Number(additionalChargeValue);
    if (isNaN(val) || val < 0) return 0;
    if (additionalChargeType === "percent") {
      return subtotal * (val / 100);
    }
    return val;
  }, [subtotal, additionalChargeType, additionalChargeValue]);

  const grandTotal = useMemo(
    () => Math.max(subtotal - discountAmount + additionalChargeAmount, 0),
    [subtotal, discountAmount, additionalChargeAmount],
  );

  async function handleCheckout() {
    const hasItems =
      txnType === "Return" ? cart.some((c) => c.quantity > 0) : cart.length > 0;
    if (!hasItems || !buyerName) return;
    if (!salesInvoiceNumber.trim() && !deliveryReceiptNumber.trim()) {
      setError("Sales Invoice or Delivery Receipt number is required");
      return;
    }
    setError("");
    setCheckingOut(true);
    try {
      const result = await callAction(
        createTransaction({
          buyerName,
          buyerAddress: buyerAddress || undefined,
          buyerContact: buyerContact || undefined,
          buyerEmail: buyerEmail || undefined,
          salesInvoiceNumber: salesInvoiceNumber || undefined,
          deliveryReceiptNumber: deliveryReceiptNumber || undefined,
          tin: tin || undefined,
          isCredit: paymentMethod === "Credit",
          creditDueDate:
            paymentMethod === "Credit" && creditDueDate
              ? new Date(creditDueDate)
              : undefined,
          paymentMethod,
          deliveryMethod: deliveryMethod as any,
          transactionType: txnType,
          transactionStatus:
            txnType === "SaleWalkIn" ||
            txnType === "Return" ||
            txnType === "Adjustment"
              ? "Completed"
              : txnType === "SalePO"
                ? "Processing"
                : "Ongoing",
          grandTotal: Math.max(
            cart
              .filter((c) => !(txnType === "Return" && c.quantity === 0))
              .reduce(
                (sum, c) => sum + Number(c.product.sellingPrice) * c.quantity,
                0,
              ) - discountAmount,
            0,
          ),
          items: cart
            .filter((c) => !(txnType === "Return" && c.quantity === 0))
            .map((c) => ({
              productId: c.product.id,
              quantity: c.quantity,
              unitPrice: Number(c.product.sellingPrice),
              totalPrice: Number(c.product.sellingPrice) * c.quantity,
            })),
          returnForReceiptNumber:
            txnType === "Return" ||
            txnType === "Damage" ||
            txnType === "Adjustment"
              ? Number(returnReceipt) || undefined
              : undefined,
          chequeDetails:
            paymentMethod === "Credit" &&
            (chequeNumber || bankName || chequeDate || payeeName)
              ? {
                  chequeNumber: chequeNumber || undefined,
                  bankName: bankName || undefined,
                  chequeDate: chequeDate ? new Date(chequeDate) : undefined,
                  payeeName: payeeName || undefined,
                }
              : undefined,
          discountType: discountType || undefined,
          discountValue: discountValue ? Number(discountValue) : undefined,
          additionalChargeType: additionalChargeType || undefined,
          additionalChargeValue: additionalChargeValue
            ? Number(additionalChargeValue)
            : undefined,
          additionalChargeDesc: additionalChargeDesc || undefined,
          transactionDate: new Date(transactionDate),
        }),
      );
      const isCredit = paymentMethod === "Credit";
      const receiptData = {
        receiptNumber: result.receiptNumber,
        date: new Date(transactionDate),
        sellerName: session?.user?.name || "Unknown",
        buyerName: buyerName,
        buyerAddress: buyerAddress || undefined,
        buyerContact: buyerContact || undefined,
        salesInvoiceNumber: salesInvoiceNumber || undefined,
        deliveryReceiptNumber: deliveryReceiptNumber || undefined,
        tin: tin || undefined,

        isCredit,
        creditDueDate:
          isCredit && creditDueDate ? new Date(creditDueDate) : undefined,
        grandTotal: grandTotal,
        items: cart
          .filter((c) => !(txnType === "Return" && c.quantity === 0))
          .map((c) => ({
            productName: c.product.productName,
            quantity: c.quantity,
            unitPrice: Number(c.product.sellingPrice),
            totalPrice: Number(c.product.sellingPrice) * c.quantity,
          })),
        paymentMethod,
        transactionType: txnType,
        chequeDetails:
          isCredit && (chequeNumber || bankName || chequeDate || payeeName)
            ? {
                chequeNumber,
                bankName,
                chequeDate: chequeDate ? new Date(chequeDate) : undefined,
                payeeName,
              }
            : undefined,
        discountType: discountType || undefined,
        discountValue: discountValue ? Number(discountValue) : undefined,
        additionalChargeType: additionalChargeType || undefined,
        additionalChargeValue: additionalChargeValue
          ? Number(additionalChargeValue)
          : undefined,
        additionalChargeDesc: additionalChargeDesc || undefined,
      };
      const doneItems = receiptData.items;
      setDone({
        receipt: result.receiptNumber,
        buyerName: buyerName,
        grandTotal: grandTotal,
        items: doneItems,
        salesInvoiceNumber: salesInvoiceNumber || undefined,
        deliveryReceiptNumber: deliveryReceiptNumber || undefined,
        tin: tin || undefined,

        isCredit,
        creditDueDate:
          isCredit && creditDueDate ? new Date(creditDueDate) : undefined,
        chequeDetails:
          isCredit && (chequeNumber || bankName || chequeDate || payeeName)
            ? {
                chequeNumber,
                bankName,
                chequeDate: chequeDate ? new Date(chequeDate) : undefined,
                payeeName,
              }
            : undefined,
        discountType: discountType || undefined,
        discountValue: discountValue ? Number(discountValue) : undefined,
        additionalChargeType: additionalChargeType || undefined,
        additionalChargeValue: additionalChargeValue
          ? Number(additionalChargeValue)
          : undefined,
        additionalChargeDesc: additionalChargeDesc || undefined,
      });
      setCart([]);
      setBuyerName("");
      setBuyerAddress("");
      setBuyerContact("");
      setBuyerEmail("");
      setReturnReceipt("");
      setSalesInvoiceNumber("");
      setdeliveryReceiptNumber("");
      setTin("");
      setTransactionDate(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
      });
      setCreditDueDate("");
      setChequeNumber("");
      setBankName("");
      setChequeDate("");
      setPayeeName("");
      setPaymentMethod("Cash");
      setDeliveryMethod("WalkIn");
      setDiscountType("");
      setDiscountValue("");
      setAdditionalChargeType("");
      setAdditionalChargeValue("");
      setAdditionalChargeDesc("");
      if (txnType !== "SalePO") {
        setTimeout(() => {
          downloadReceipt(receiptData).catch(() => {});
          toast.success("Transaction completed successfully");
          setDone(null);
        }, 500);
      } else {
        toast.success("Purchase Order created successfully");
        setDone(null);
      }
    } catch (e: any) {
      toast.error(e.message || "Transaction failed");
    } finally {
      setCheckingOut(false);
    }
  }

  const [showCartMobile, setShowCartMobile] = useState(false);
  const [shortcutHint, setShortcutHint] = useState<"ready" | "done" | "">("");

  useEffect(() => {
    if (
      txnType !== "Return" &&
      txnType !== "Damage" &&
      txnType !== "Adjustment"
    )
      return;
    if (!returnReceipt) return;
    const num = parseInt(returnReceipt, 10);
    if (isNaN(num)) return;
    const timer = setTimeout(() => {
      setLoadingReturn(true);
      setCart([]);
      callAction(getReturnTransaction(num))
        .then((orig) => {
          setBuyerName(orig.buyerName ?? "");
          setTin((orig as any).tin ?? "");
          const autoItems = orig.items.map(
            (i) =>
              ({
                product: i.product,
                quantity: txnType === "Return" ? 0 : (i.quantity ?? 0),
                originalQty: i.quantity ?? 0,
              }) as unknown as CartItem,
          );
          setCart(autoItems);
        })
        .catch((err) => {
          setCart([]);
          const msg =
            err instanceof Error ? err.message : "Failed to load receipt";
          toast.error(
            msg.replace(
              /^Receipt #(\d+) not found$/,
              "Receipt [$1] was not found.",
            ),
          );
        })
        .finally(() => setLoadingReturn(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [returnReceipt, txnType]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (cart.length > 0 && buyerName && !checkingOut) {
          handleCheckout();
          setShortcutHint("done");
          setTimeout(() => setShortcutHint(""), 2000);
        } else {
          setShortcutHint("ready");
          setTimeout(() => setShortcutHint(""), 1500);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cart.length, buyerName, checkingOut, handleCheckout]);

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="POS Terminal"
          subtitle="Process sales, returns, adjustments, and damages."
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-[calc(100vh-12rem)] relative">
        {/* Mobile Cart FAB — fixed bottom bar in thumb zone */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            {cart.length > 0 ? (
              <button
                onClick={() => setShowCartMobile(true)}
                title="View cart summary"
                className="w-full flex items-center justify-between px-5 py-4 bg-[#fd761a] text-white rounded-2xl shadow-2xl shadow-[#fd761a]/30 active:scale-[0.97] transition-all font-bold text-sm"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>
                    {cart.length} item{cart.length > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-lg font-black">
                    {grandTotal.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </button>
            ) : (
              <div className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm border border-[#e2e8f0] rounded-2xl text-center text-xs text-[#94a3b8] font-medium">
                Tap a product to add it to the cart
              </div>
            )}
          </div>
        </div>
        {/* Product Selection Area */}
        <div className="flex-[2] flex flex-col gap-4 min-w-0">
          <div className="flex flex-col gap-3">
            {/* Search bar - own full-width line so it never gets squished */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
              />
            </div>
            {/* Filters - second line, wrap on small screens */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={parentCategory}
                onChange={(e) => {
                  setParentCategory(
                    e.target.value ? Number(e.target.value) : "",
                  );
                }}
                className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
              >
                <option value="">All Categories</option>
                {parentCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterBrand}
                onChange={(e) =>
                  setFilterBrand(e.target.value ? Number(e.target.value) : "")
                }
                className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                value={filterSupplier}
                onChange={(e) =>
                  setFilterSupplier(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#0e212c] focus:outline-none focus:border-[#fd761a]"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} style={{ color: "#0e212c" }}>
                    {s.supplierName}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 border border-[#e2e8f0] rounded-lg p-0.5 bg-white shrink-0 sm:ml-auto">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-[#fd761a] text-white shadow-sm"
                      : "text-[#64748b] hover:bg-[#f1f5f9]"
                  }`}
                  title="List view"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  List
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === "grid"
                      ? "bg-[#fd761a] text-white shadow-sm"
                      : "text-[#64748b] hover:bg-[#f1f5f9]"
                  }`}
                  title="Grid view"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h4v4H4zM10 6h4v4h-4zM16 6h4v4h-4zM4 12h4v4H4zM10 12h4v4h-4zM16 12h4v4h-4zM4 18h4v4H4zM10 18h4v4h-4zM16 18h4v4h-4z"
                    />
                  </svg>
                  Grid
                </button>
              </div>
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="flex-1 overflow-y-auto min-w-0 border border-[#e2e8f0] rounded-xl bg-white">
              <table className="w-full">
                <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-right p-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-right p-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-20">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`cursor-pointer hover:bg-[#f1f5f9] transition-colors ${product.quantity <= 0 ? "opacity-60" : ""}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {(product as any).imageUrl ? (
                            <img
                              src={(product as any).imageUrl}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-[#e2e8f0] shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-[#94a3b8]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0e212c] truncate">
                              {product.productName}
                            </p>
                            <p className="text-[11px] text-[#94a3b8] truncate">
                              {product.category}
                              {(product as any).brandRel?.name
                                ? ` · ${(product as any).brandRel.name}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-[#fd761a] text-sm whitespace-nowrap">
                        {Number(product.sellingPrice).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        <span
                          className={(() => {
                            const effectiveQty =
                              product.quantity -
                              (pendingPOQty[product.id] || 0);
                            return effectiveQty <= product.minThreshold &&
                              effectiveQty > 0
                              ? "text-rose-500 font-bold"
                              : "text-[#94a3b8]";
                          })()}
                        >
                          {product.quantity - (pendingPOQty[product.id] || 0)}
                          {pendingPOQty[product.id]
                            ? ` (${product.quantity})`
                            : ""}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-[#94a3b8] text-sm"
                      >
                        No available products match your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 content-start min-w-0">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    addToCart(product);
                    // Optional: Vibrate or feedback for mobile
                  }}
                  className={`bg-white border border-[#e2e8f0] rounded-xl p-3 sm:p-4 text-left hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200 group aspect-square flex flex-col ${product.quantity <= 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {(product as any).imageUrl ? (
                    <img
                      src={(product as any).imageUrl}
                      alt=""
                      className="w-full h-20 sm:h-24 object-cover rounded-lg mb-3 border border-[#e2e8f0]"
                    />
                  ) : (
                    <div className="w-full h-20 sm:h-24 rounded-lg mb-3 bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center">
                      <Package className="h-8 w-8 text-[#94a3b8]" />
                    </div>
                  )}
                  <p className="font-semibold text-[13px] sm:text-sm text-[#0e212c] truncate group-hover:text-[#fd761a] transition-colors leading-tight">
                    {product.productName}
                  </p>
                  <div className="flex items-baseline justify-between mt-1 gap-1">
                    <p className="text-base sm:text-lg font-bold text-[#fd761a]">
                      {Number(product.sellingPrice).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {(() => {
                      const effectiveQty =
                        product.quantity - (pendingPOQty[product.id] || 0);
                      return (
                        <p
                          className={`text-[10px] ${effectiveQty <= product.minThreshold && effectiveQty > 0 ? "text-rose-500 font-bold" : "text-[#94a3b8]"}`}
                        >
                          {effectiveQty}
                          {pendingPOQty[product.id]
                            ? ` (${product.quantity})`
                            : ""}
                        </p>
                      );
                    })()}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-[#94a3b8]">
                  No available products match your search
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Sidebar (Desktop) / Drawer (Mobile) */}
        <div
          className={cn(
            "lg:flex flex-col w-full bg-white border border-[#e2e8f0] rounded-xl shadow-sm lg:relative overflow-x-hidden",
            "fixed inset-x-0 bottom-0 z-[100] lg:z-auto h-[90vh] lg:h-auto transform transition-transform duration-300 ease-in-out lg:translate-y-0 translate-y-full",
            showCartMobile && "translate-y-0",
          )}
          style={{ width: `min(${cartWidth}px, 100%)` } as React.CSSProperties}
        >
          {/* Drag Handle - Desktop only */}
          <div
            onMouseDown={handleDragStart}
            className={`hidden lg:block absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#fd761a]/30 transition-colors z-10 ${isDragging ? "bg-[#fd761a]/50" : "bg-transparent"}`}
            title="Drag to resize cart pane"
          />
          {/* Mobile Handle / Header */}
          <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
            <div className="w-12 h-1.5 bg-[#e2e8f0] rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
            <h2 className="font-bold text-[#0e212c]">Checkout Cart</h2>
            <button
              onClick={() => setShowCartMobile(false)}
              className="p-2 text-[#94a3b8] hover:text-[#0e212c]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="hidden lg:block p-5 border-b border-[#e2e8f0]">
            <h2 className="font-semibold text-[#0e212c] flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-[#fd761a]" /> Cart
              {cart.length > 0 && (
                <span className="ml-auto text-[#fd761a]">
                  {cart.length} item{cart.length > 1 ? "s" : ""}
                </span>
              )}
            </h2>
          </div>

          <div className="p-5 border-b border-[#e2e8f0] space-y-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
              <input
                type="date"
                value={transactionDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a] transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 text-sm">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <ShoppingCart className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                <select
                  value={txnType}
                  title="Select transaction type"
                  onChange={(e) => {
                    setTxnType(e.target.value as any);
                    setError("");
                    setReturnReceipt("");
                  }}
                  className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a] transition-colors"
                >
                  {TXN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {(txnType === "Return" ||
                txnType === "Damage" ||
                txnType === "Adjustment") && (
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-2 flex-1 min-w-0">
                  {loadingReturn ? (
                    <Loader2 className="h-3.5 w-3.5 text-amber-600 shrink-0 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  )}
                  <input
                    type="number"
                    value={returnReceipt}
                    onChange={(e) => setReturnReceipt(e.target.value)}
                    placeholder={
                      txnType === "Return"
                        ? "Original Receipt #"
                        : "Reference Receipt #"
                    }
                    className="w-full min-w-0 bg-transparent text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <Receipt className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
              <input
                type="text"
                value={salesInvoiceNumber}
                onChange={(e) => setSalesInvoiceNumber(e.target.value)}
                placeholder="Sales Invoice #"
                className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#fd761a] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <Receipt className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
              <input
                type="text"
                value={deliveryReceiptNumber}
                onChange={(e) => setdeliveryReceiptNumber(e.target.value)}
                placeholder="Delivery Receipt #"
                className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#fd761a] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <Receipt className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
              <input
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="TIN (Optional)"
                className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#fd761a] transition-colors"
              />
            </div>

            {txnType !== "Return" && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2.5 relative min-w-0">
                  <User className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => {
                      setBuyerName(e.target.value);
                      setShowBuyerDropdown(true);
                    }}
                    onFocus={() => setShowBuyerDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowBuyerDropdown(false), 200)
                    }
                    placeholder="Buyer name"
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#fd761a] transition-colors"
                  />
                  {showBuyerDropdown && buyerSuggestions.length > 0 && (
                    <div className="absolute left-5 top-full mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-xl z-[110] max-h-48 overflow-y-auto">
                      {buyerSuggestions.map((b) => (
                        <button
                          key={b.buyerName}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setBuyerName(b.buyerName);
                            setBuyerAddress(b.buyerAddress || "");
                            setBuyerContact(b.buyerContact || "");
                            setBuyerEmail(b.buyerEmail || "");
                            setTin(b.tin || "");
                            setShowBuyerDropdown(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-sm text-[#0e212c] hover:bg-[#fff5ed] hover:text-[#fd761a] transition-colors border-b border-[#e2e8f0] last:border-b-0"
                        >
                          <span className="font-medium">{b.buyerName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                  <input
                    type="text"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="Address (Optional)"
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Phone className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                  <input
                    type="text"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="Contact (Optional)"
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="Email (Optional)"
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <CreditCard className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                <select
                  value={paymentMethod}
                  title="Select payment method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Truck className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                <select
                  value={deliveryMethod}
                  title="Select delivery method"
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none"
                >
                  {DELIVERY_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {paymentMethod === "Credit" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                  <input
                    type="date"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
                  />
                  <span className="text-[10px] text-[#94a3b8] whitespace-nowrap">
                    Due Date
                  </span>
                </div>
                <p className="text-[10px] text-amber-600 ml-6">
                  Credit sale — payment due by selected date
                </p>

                <div className="pt-2 border-t border-[#e2e8f0] mt-2">
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">
                    Cheque Details
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="text"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        placeholder="Cheque/Ref #"
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
                      />
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank Name"
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
                      />
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
                      />
                      <span className="text-[10px] text-[#94a3b8] whitespace-nowrap">
                        Cheque Date
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="text"
                        value={payeeName}
                        onChange={(e) => setPayeeName(e.target.value)}
                        placeholder={buyerName || "Payee Name"}
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-sm text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[150px]">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-2 sm:gap-3 bg-[#f8fafc] rounded-lg p-2.5 sm:p-3 group hover:bg-[#f1f5f9] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0e212c] truncate">
                    {item.product.productName}
                  </p>
                  <p className="text-[10px] text-[#94a3b8] break-words">
                    {categoryDisplay(item.product)}
                  </p>
                  <p className="text-[10px] text-[#94a3b8] font-mono">
                    {Number(item.product.sellingPrice).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {item.originalQty !== undefined && (
                      <span className="ml-2 text-[#94a3b8]">
                        Orig: {item.originalQty}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    title="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] active:bg-[#fd761a] active:text-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  {editingQty === item.product.id ? (
                    <input
                      type="number"
                      min={1}
                      value={qtyInput}
                      autoFocus
                      onChange={(e) => setQtyInput(e.target.value)}
                      onBlur={() => commitQtyEdit(item.product.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          (e.target as HTMLInputElement).blur();
                        }
                        if (e.key === "Escape") {
                          setEditingQty(null);
                        }
                      }}
                      className="w-16 h-10 text-center text-xs font-bold text-[#0e212c] border border-[#fd761a] rounded-lg focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startQtyEdit(item.product.id, item.quantity)
                      }
                      className="min-w-[40px] h-10 text-center text-xs font-bold text-[#0e212c] px-2 hover:bg-white rounded-lg transition-colors"
                      aria-label="Edit quantity"
                    >
                      {item.quantity}
                    </button>
                  )}
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    title="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] active:bg-[#fd761a] active:text-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  title="Remove from cart"
                  className="w-10 h-10 flex items-center justify-center text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-sm text-[#94a3b8] text-center py-12">
                Cart is empty
              </p>
            )}
            {cart.length > 0 && (
              <div className="border-t border-[#e2e8f0] mt-3 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                    Live Receipt
                  </p>
                  <span className="text-[10px] font-semibold text-[#64748b]">
                    {cart.reduce((s, c) => s + c.quantity, 0)} unit
                    {cart.reduce((s, c) => s + c.quantity, 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider pb-1 border-b border-[#e2e8f0]">
                  <span className="flex-1">Item</span>
                  <span className="w-10 text-center">Qty</span>
                  <span className="w-[72px] text-right">Price</span>
                  <span className="w-[72px] text-right">Total</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-center text-[11px] py-0.5"
                    >
                      <span className="flex-1 text-[#0e212c] font-medium truncate pr-1">
                        {item.product.productName}
                      </span>
                      <span className="w-10 text-center text-[#64748b]">
                        {item.quantity}
                      </span>
                      <span className="w-[72px] text-right font-mono text-[#64748b]">
                        {Number(item.product.sellingPrice).toLocaleString(
                          "en-PH",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                      <span className="w-[72px] text-right font-mono text-[#0e212c] font-semibold">
                        {(
                          Number(item.product.sellingPrice) * item.quantity
                        ).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-[#e2e8f0] space-y-4 bg-white sticky bottom-0">
            {subtotal > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-[#64748b] uppercase shrink-0">
                  Discount
                </label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(
                      e.target.value as "amount" | "percent" | "",
                    );
                    if (e.target.value === "") setDiscountValue("");
                  }}
                  className="h-9 px-2 border border-[#e2e8f0] rounded-lg text-xs bg-white focus:outline-none focus:border-[#fd761a]"
                >
                  <option value="">None</option>
                  <option value="amount">Fixed Amount</option>
                  <option value="percent">Percent</option>
                </select>
                {discountType && (
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8]">
                      {discountType === "percent" ? "%" : "\u20B1"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={discountType === "percent" ? "100" : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "0" : "0.00"}
                      className="w-full h-9 pl-7 pr-2 border border-[#e2e8f0] rounded-lg text-xs text-right font-mono bg-white focus:outline-none focus:border-[#fd761a]"
                    />
                  </div>
                )}
              </div>
            )}
            {subtotal > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-[#64748b] uppercase shrink-0">
                  Additional
                </label>
                <select
                  value={additionalChargeType}
                  onChange={(e) => {
                    setAdditionalChargeType(
                      e.target.value as "amount" | "percent" | "",
                    );
                    if (e.target.value === "") {
                      setAdditionalChargeValue("");
                      setAdditionalChargeDesc("");
                    }
                  }}
                  className="h-9 px-2 border border-[#e2e8f0] rounded-lg text-xs bg-white focus:outline-none focus:border-[#fd761a]"
                >
                  <option value="">None</option>
                  <option value="amount">Fixed Amount</option>
                  <option value="percent">Percent</option>
                </select>
                {additionalChargeType && (
                  <>
                    <input
                      type="text"
                      value={additionalChargeDesc}
                      onChange={(e) => setAdditionalChargeDesc(e.target.value)}
                      placeholder="Description"
                      className="h-9 px-2 border border-[#e2e8f0] rounded-lg text-xs bg-white focus:outline-none focus:border-[#fd761a] w-28"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8]">
                        {additionalChargeType === "percent" ? "%" : "\u20B1"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={
                          additionalChargeType === "percent" ? "100" : undefined
                        }
                        value={additionalChargeValue}
                        onChange={(e) =>
                          setAdditionalChargeValue(e.target.value)
                        }
                        placeholder={
                          additionalChargeType === "percent" ? "0" : "0.00"
                        }
                        className="w-full h-9 pl-7 pr-2 border border-[#e2e8f0] rounded-lg text-xs text-right font-mono bg-white focus:outline-none focus:border-[#fd761a]"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-[#64748b]">
                <span>Subtotal</span>
                <span className="font-mono">
                  {subtotal.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600">
                <span>
                  Discount
                  {discountType === "percent" && (
                    <span className="ml-1 text-[10px]">({discountValue}%)</span>
                  )}
                </span>
                <span className="font-mono">
                  -
                  {discountAmount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            {additionalChargeAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-600">
                <span>
                  {additionalChargeDesc || "Additional Charge"}
                  {additionalChargeType === "percent" && (
                    <span className="ml-1 text-[10px]">
                      ({additionalChargeValue}%)
                    </span>
                  )}
                </span>
                <span className="font-mono">
                  +
                  {additionalChargeAmount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#0e212c]">Total</span>
              <span className="text-xl font-black text-[#fd761a]">
                {grandTotal.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded border border-rose-100">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCheckout}
                title="Process the transaction"
                disabled={cart.length === 0 || !buyerName || checkingOut}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#fd761a]/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : paymentMethod === "Credit" ? (
                  "Credit"
                ) : (
                  "Process Order"
                )}
              </button>
              {done && (
                <button
                  onClick={() =>
                    downloadReceiptPdf({
                      receiptNumber: done.receipt,
                      date: new Date(),
                      sellerName: session?.user?.name || "Unknown",
                      buyerName: done.buyerName,
                      items: done.items,
                      grandTotal: done.grandTotal,
                      paymentMethod,
                      transactionType: txnType,
                      salesInvoiceNumber: done.salesInvoiceNumber,
                      deliveryReceiptNumber: done.deliveryReceiptNumber,
                      tin: done.tin,
                      isCredit: done.isCredit,
                      creditDueDate: done.creditDueDate,
                      chequeDetails: done.chequeDetails,
                      discountType: done.discountType,
                      discountValue: done.discountValue,
                    })
                  }
                  title="Download receipt as PDF"
                  className="px-4 bg-[#0e212c] text-white rounded-xl hover:bg-[#1a3a4a] transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Scrim */}
      {showCartMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          onClick={() => setShowCartMobile(false)}
        />
      )}
    </div>
  );
}
