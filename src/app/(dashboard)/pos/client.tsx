/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 12, 2026
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
import { PageHeader } from "@/components/ui/page-header";
import { downloadReceipt, downloadReceiptPdf } from "@/lib/receipt";
import { toast } from "sonner";
import type { Product } from "@prisma/client";

interface BuyerInfo {
  buyerName: string;
  buyerAddress?: string | null;
  buyerContact?: string | null;
  buyerEmail?: string | null;
}

type CategoryWithChildren = {
  id: number;
  name: string;
  parentCategoryId: number | null;
  children: { id: number; name: string; parentCategoryId: number | null }[];
};

interface Props {
  products: Product[];
  buyers: BuyerInfo[];
  categories: CategoryWithChildren[];
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

export function POSClient({ products, buyers, categories }: Props) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [parentCategory, setParentCategory] = useState<number | "">("");
  const [childCategory, setChildCategory] = useState<number | "">("");
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
  const [invoiceNumber, setInvoiceNumber] = useState("");
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
    invoiceNumber?: string;
    isCredit?: boolean;
    creditDueDate?: Date;
    chequeDetails?: {
      chequeNumber: string;
      bankName: string;
      chequeDate?: Date;
      payeeName: string;
    };
  } | null>(null);
  const [error, setError] = useState("");
  const [editingQty, setEditingQty] = useState<number | null>(null);
  const [qtyInput, setQtyInput] = useState("");

  const buyerSuggestions = useMemo(
    () =>
      buyers.filter((b) =>
        b.buyerName.toLowerCase().includes(buyerName.toLowerCase()),
      ),
    [buyerName, buyers],
  );

  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentCategoryId === null),
    [categories],
  );

  const childCategories = useMemo(() => {
    if (parentCategory === "") return [];
    return categories.find((c) => c.id === parentCategory)?.children || [];
  }, [categories, parentCategory]);

  const filtered = products.filter((p) => {
    if (p.quantity <= 0) return false;
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (childCategory !== "" && p.categoryId === childCategory) return true;
    if (parentCategory !== "" && p.categoryId === parentCategory) return true;
    if (parentCategory !== "" && childCategory === "") {
      const parent = categories.find((c) => c.id === parentCategory);
      if (parent && p.category === parent.name) return true;
      const childIds = (parent?.children || []).map((c) => c.id);
      if (childIds.includes(p.categoryId ?? -1)) return true;
      return false;
    }
    if (parentCategory === "" && childCategory === "") return true;
    return false;
  });

  function categoryDisplay(product: Product): string {
    if (!product.categoryId) return product.category || "";
    const parent = categories.find(
      (c) =>
        c.id === product.categoryId ||
        c.children.some((ch) => ch.id === product.categoryId),
    );
    if (!parent) return product.category || "";
    if (parent.id === product.categoryId) return parent.name;
    return `${parent.name} (${parent.children.find((ch) => ch.id === product.categoryId)?.name || ""})`;
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        const maxQty =
          txnType === "Return"
            ? existing.originalQty || product.quantity
            : product.quantity;
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: Math.min(c.quantity + 1, maxQty) }
            : c,
        );
      }
      const maxInit =
        txnType === "Return" ? 0 : Math.min(1, product.quantity || 0) || 1;
      return [...prev, { product, quantity: maxInit }];
    });
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          const maxQty =
            txnType === "Return"
              ? c.originalQty || c.product.quantity
              : c.product.quantity;
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
        const maxQty =
          txnType === "Return"
            ? c.originalQty || c.product.quantity
            : c.product.quantity;
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

  const grandTotal = useMemo(
    () =>
      cart.reduce(
        (sum, c) => sum + Number(c.product.sellingPrice) * c.quantity,
        0,
      ),
    [cart],
  );

  async function handleCheckout() {
    const hasItems =
      txnType === "Return" ? cart.some((c) => c.quantity > 0) : cart.length > 0;
    if (!hasItems || !buyerName) return;
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required");
      return;
    }
    setError("");
    setCheckingOut(true);
    try {
      const result = await createTransaction({
        buyerName,
        buyerAddress: buyerAddress || undefined,
        buyerContact: buyerContact || undefined,
        buyerEmail: buyerEmail || undefined,
        invoiceNumber: invoiceNumber || undefined,
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
        grandTotal: cart
          .filter((c) => !(txnType === "Return" && c.quantity === 0))
          .reduce(
            (sum, c) => sum + Number(c.product.sellingPrice) * c.quantity,
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
      });
      const isCredit = paymentMethod === "Credit";
      const receiptData = {
        receiptNumber: result.receiptNumber,
        date: new Date(),
        sellerName: session?.user?.name || "Unknown",
        buyerName: buyerName,
        buyerAddress: buyerAddress || undefined,
        buyerContact: buyerContact || undefined,
        invoiceNumber: invoiceNumber || undefined,
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
      };
      const doneItems = receiptData.items;
      const doneGrandTotal = doneItems.reduce((s, i) => s + i.totalPrice, 0);
      setDone({
        receipt: result.receiptNumber,
        buyerName: buyerName,
        grandTotal: doneGrandTotal,
        items: doneItems,
        invoiceNumber: invoiceNumber || undefined,
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
      });
      setCart([]);
      setBuyerName("");
      setBuyerAddress("");
      setBuyerContact("");
      setBuyerEmail("");
      setReturnReceipt("");
      setInvoiceNumber("");
      setCreditDueDate("");
      setChequeNumber("");
      setBankName("");
      setChequeDate("");
      setPayeeName("");
      setPaymentMethod("Cash");
      setDeliveryMethod("WalkIn");
      setTimeout(() => {
        downloadReceipt(receiptData).catch(() => {});
        toast.success("Transaction completed successfully");
        setDone(null);
      }, 500);
    } catch (e: any) {
      toast.error(e.message || "Transaction failed");
    } finally {
      setCheckingOut(false);
    }
  }

  const [showCartMobile, setShowCartMobile] = useState(false);
  const [shortcutHint, setShortcutHint] = useState<"ready" | "done" | "">("");

  useEffect(() => {
    if (txnType !== "Return" || !returnReceipt) return;
    const num = parseInt(returnReceipt, 10);
    if (isNaN(num)) return;
    setLoadingReturn(true);
    setCart([]);
    getReturnTransaction(num)
      .then((orig) => {
        setBuyerName(orig.buyerName);
        const autoItems = orig.items
          .map((i) => {
            const prod = products.find((p) => p.id === i.productId);
            if (!prod) return null;
            return {
              product: prod,
              quantity: 0,
              originalQty: i.quantity ?? 0,
            } as CartItem;
          })
          .filter((x): x is CartItem => x !== null);
        setCart(autoItems);
      })
      .catch(() => {
        setCart([]);
      })
      .finally(() => setLoadingReturn(false));
  }, [returnReceipt, txnType, products]);

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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
              />
            </div>
            <select
              value={parentCategory}
              onChange={(e) => {
                setParentCategory(e.target.value ? Number(e.target.value) : "");
                setChildCategory("");
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
            {parentCategory !== "" && childCategories.length > 0 && (
              <select
                value={childCategory}
                onChange={(e) =>
                  setChildCategory(e.target.value ? Number(e.target.value) : "")
                }
                className="px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]"
              >
                <option value="">All Subcategories</option>
                {childCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start max-w-[800px]">
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
                  <p
                    className={`text-[10px] ${product.quantity <= product.minThreshold && product.quantity > 0 ? "text-rose-500 font-bold" : "text-[#94a3b8]"}`}
                  >
                    {product.quantity}
                  </p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#94a3b8]">
                No available products match your search
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar (Desktop) / Drawer (Mobile) */}
        <div
          className={cn(
            "lg:flex flex-col w-full lg:w-[380px] bg-white border border-[#e2e8f0] rounded-xl shadow-sm lg:relative overflow-x-hidden",
            "fixed inset-x-0 bottom-0 z-[100] lg:z-auto h-[90vh] lg:h-auto transform transition-transform duration-300 ease-in-out lg:translate-y-0 translate-y-full",
            showCartMobile && "translate-y-0",
          )}
        >
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 text-sm">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <ShoppingCart className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                <select
                  value={txnType}
                  title="Select transaction type"
                  onChange={(e) => {
                    setTxnType(e.target.value as any);
                    setCart([]);
                    setError("");
                    setReturnReceipt("");
                  }}
                  className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-xs text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a] transition-colors"
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
                    className="w-full min-w-0 bg-transparent text-xs text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <Receipt className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Invoice # *"
                className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#fd761a] transition-colors"
              />
            </div>

            {txnType !== "Return" && (
              <div className="space-y-2 text-xs">
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
                    placeholder="Buyer name *"
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1.5 text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#fd761a] transition-colors"
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
                            setShowBuyerDropdown(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-[#0e212c] hover:bg-[#fff5ed] hover:text-[#fd761a] transition-colors border-b border-[#e2e8f0] last:border-b-0"
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
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Phone className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                  <input
                    type="text"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="Contact (Optional)"
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="Email (Optional)"
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-[#0e212c] placeholder:text-[#94a3b8] focus:outline-none"
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
                  className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-xs text-[#0e212c] bg-transparent focus:outline-none"
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
                  className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-xs text-[#0e212c] bg-transparent focus:outline-none"
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
                    className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-xs text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
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
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-xs text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
                      />
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank Name"
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-xs text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
                      />
                    </div>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-xs text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
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
                        className="flex-1 min-w-0 border-b border-[#e2e8f0] py-1 text-xs text-[#0e212c] bg-transparent focus:outline-none focus:border-[#fd761a]"
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
                    {(item.product as any).brandRel?.name && (
                      <span className="text-[10px] font-normal text-[#94a3b8] ml-1">
                        {(item.product as any).brandRel.name}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-[#94a3b8] truncate">
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
                    className="w-9 h-9 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] active:bg-[#fd761a] active:text-white transition-colors"
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
                      className="w-16 h-9 text-center text-xs font-bold text-[#0e212c] border border-[#fd761a] rounded-lg focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startQtyEdit(item.product.id, item.quantity)
                      }
                      className="min-w-[40px] h-9 text-center text-xs font-bold text-[#0e212c] px-2 hover:bg-white rounded-lg transition-colors"
                      aria-label="Edit quantity"
                    >
                      {item.quantity}
                    </button>
                  )}
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    title="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-lg text-[#64748b] active:bg-[#fd761a] active:text-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  title="Remove from cart"
                  className="w-9 h-9 flex items-center justify-center text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
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
                  <span className="w-20 text-right hidden sm:block">
                    Category
                  </span>
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
                      <span className="w-20 text-right text-[#94a3b8] truncate hidden sm:block">
                        {categoryDisplay(item.product)}
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
                      invoiceNumber: done.invoiceNumber,
                      isCredit: done.isCredit,
                      creditDueDate: done.creditDueDate,
                      chequeDetails: done.chequeDetails,
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
