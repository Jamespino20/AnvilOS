/**
 * @fileoverview Receipt generation utilities – PDF download using jsPDF
 */

/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 16, 2026
*/

import { jsPDF } from "jspdf";
import { formatMoney } from "@/lib/format";

const COMPANY = "CWL Hardware";
const THEME_BLUE = "#0e212c";
const THEME_ORANGE = "#fd761a";

const TXN_LABELS: Record<string, string> = {
  SaleWalkIn: "Sale (Walk-In)",
  SalePO: "Sale (P.O.)",
  Return: "Return",
  Restock: "Restock",
  Adjustment: "Adjustment",
  Damage: "Damage",
};

export async function downloadReceipt(
  data: Parameters<typeof downloadReceiptPdf>[0],
) {
  await downloadReceiptPdf(data);
}

export async function downloadReceiptPdf(data: {
  receiptNumber: number;
  date: Date;
  sellerName: string;
  buyerName: string;
  buyerAddress?: string;
  buyerContact?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  grandTotal: number;
  paymentMethod?: string;
  transactionType: string;
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
  discountType?: string;
  discountValue?: number;
  discountDesc?: string;
  additionalChargeType?: string;
  additionalChargeValue?: number;
  additionalChargeDesc?: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: [80, 400] });

  const pw = 80;
  const l = 5;
  const r = pw - 5;
  const cx = pw / 2;

  let y = 8;

  // --- Header with orange accent ---
  doc.setFillColor(253, 118, 26);
  doc.rect(0, 0, pw, 3, "F");

  // Logo — maintain aspect ratio on 80mm receipt, convert PNG→JPEG to strip alpha
  try {
    const resp = await fetch("/images/CWLHardware_Logo.png");
    const blob = await resp.blob();
    const reader = new FileReader();
    const b64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const img = new Image();
    img.src = b64;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    const aspect = img.naturalWidth / img.naturalHeight;
    const maxLogoW = 32;
    const maxLogoH = 14;
    let logoW = maxLogoW;
    let logoH = logoW / aspect;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = logoH * aspect;
    }
    // Draw on white canvas to strip alpha, export as JPEG
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const jpegB64 = canvas.toDataURL("image/jpeg", 0.95);
    const jpegPure = jpegB64.includes(",") ? jpegB64.split(",")[1] : jpegB64;
    doc.addImage(jpegPure, "JPEG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + 3;
  } catch {
    console.warn("Logo not available, skipping in receipt");
  }

  doc.setTextColor(14, 33, 44);
  doc.setFont("courier", "bold");
  doc.setFontSize(18);
  doc.text(COMPANY, cx, y + 6, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Hardware & Supply", cx, y + 11, { align: "center" });
  doc.setFontSize(7);
  doc.text("208 Pulilan Regional Rd, Pulilan, Bulacan", cx, y + 15, {
    align: "center",
  });
  y += 23;

  // Separator
  doc.setDrawColor(253, 118, 26);
  doc.setLineWidth(0.5);
  doc.line(l, y, r, y);
  y += 5;

  // --- Receipt header info ---
  doc.setFontSize(9);
  doc.setFont("courier", "bold");
  doc.setTextColor(14, 33, 44);
  doc.text(`RECEIPT #${data.receiptNumber}`, cx, y, { align: "center" });
  y += 5;
  if (data.salesInvoiceNumber) {
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(14, 33, 44);
    doc.text(`SALES INV #${data.salesInvoiceNumber}`, cx, y, {
      align: "center",
    });
    y += 4;
    doc.setFont("courier", "normal");
  }
  if (data.deliveryReceiptNumber) {
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(14, 33, 44);
    doc.text(`DELIVERY RECEIPT #${data.deliveryReceiptNumber}`, cx, y, {
      align: "center",
    });
    y += 4;
    doc.setFont("courier", "normal");
  }
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(data.date.toLocaleString("en-PH"), cx, y, { align: "center" });
  y += 4;
  doc.text(`Seller: ${data.sellerName}`, cx, y, { align: "center" });
  y += 6;

  // --- Buyer section ---
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(l, y, r, y);
  y += 3;
  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(14, 33, 44);
  doc.text("BUYER", l, y);
  y += 1.5;
  doc.line(l, y, r, y);
  y += 3;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(14, 33, 44);
  doc.text(data.buyerName, l, y);
  y += 4.5;
  if (data.buyerAddress) {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(data.buyerAddress, l, y);
    y += 4;
  }
  if (data.buyerContact) {
    doc.text(data.buyerContact, l, y);
    y += 4;
  }
  if (data.tin) {
    doc.text(`TIN: ${data.tin}`, l, y);
    y += 4;
  }
  y += 2;

  // --- Transaction info ---
  doc.setDrawColor(226, 232, 240);
  doc.line(l, y, r, y);
  y += 3;
  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(14, 33, 44);
  doc.text("TRANSACTION", l, y);
  y += 1.5;
  doc.line(l, y, r, y);
  y += 3;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Type: ${TXN_LABELS[data.transactionType] || data.transactionType}`,
    l,
    y,
  );
  y += 4;
  if (data.isCredit || data.paymentMethod) {
    doc.text(
      `Payment: ${data.isCredit ? "Credit" : data.paymentMethod}`,
      l,
      y,
    );
    y += 4;
  }
  if (data.isCredit) {
    doc.text(
      data.creditDueDate
        ? `Due Date: ${new Date(data.creditDueDate).toLocaleDateString("en-PH")}`
        : "Due Date: None",
      l,
      y,
    );
    y += 4;
  }
  if (data.isCredit) {
    y += 1;
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(14, 33, 44);
    doc.text("CHEQUE DETAILS", l, y);
    y += 1.5;
    doc.line(l, y, r, y);
    y += 3;
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    if (data.chequeDetails?.chequeNumber) {
      doc.text(`Cheque #: ${data.chequeDetails.chequeNumber}`, l, y);
      y += 4;
    }
    if (data.chequeDetails?.bankName) {
      doc.text(`Bank: ${data.chequeDetails.bankName}`, l, y);
      y += 4;
    }
    if (data.chequeDetails?.chequeDate) {
      doc.text(
        `Cheque Date: ${new Date(data.chequeDetails.chequeDate).toLocaleDateString("en-PH")}`,
        l,
        y,
      );
      y += 4;
    }
    if (data.chequeDetails?.payeeName) {
      doc.text(`Payee: ${data.chequeDetails.payeeName}`, l, y);
      y += 4;
    }
  }
  y += 2;

  // --- Items table ---
  doc.setDrawColor(226, 232, 240);
  doc.line(l, y, r, y);
  y += 3;
  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(14, 33, 44);
  doc.text("ITEMS", l, y);
  y += 2;
  doc.line(l, y, r, y);
  y += 2;

  // Column headers (6pt)
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.setFont("courier", "bold");
  doc.text("Item", l, y);
  doc.text("Qty", 42, y, { align: "center" });
  doc.text("Price", 57, y, { align: "right" });
  doc.text("Total", r, y, { align: "right" });
  y += 1.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(l, y, r, y);
  y += 2.5;

  // Items
  doc.setFont("courier", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(14, 33, 44);
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const name =
      item.productName.length > 22
        ? item.productName.substring(0, 21) + "\u2026"
        : item.productName;
    const bg = i % 2 === 1 ? 248 : 255;
    doc.setFillColor(bg, bg, bg);
    doc.rect(l, y - 2, r - l, 4, "F");
    doc.text(name, l + 0.5, y);
    doc.text(String(item.quantity), 42, y, { align: "center" });
    doc.text(formatMoney(item.unitPrice), 57, y, { align: "right" });
    doc.text(formatMoney(item.totalPrice), r, y, { align: "right" });
    y += 4;
  }

  // Grand total — value on its own line to avoid overflow
  y += 1.5;
  doc.setDrawColor(14, 33, 44);
  doc.setLineWidth(0.5);
  doc.line(l, y, r, y);
  y += 2.5;

  // Show subtotal + discount + additional charges when applicable
  const hasDiscount =
    data.discountType && data.discountValue && data.discountValue > 0;
  const hasAdditionalCharge =
    data.additionalChargeType &&
    data.additionalChargeValue &&
    data.additionalChargeValue > 0;
  if (hasDiscount || hasAdditionalCharge) {
    const subtotal = data.items.reduce((s, i) => s + i.totalPrice, 0);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal", l, y);
    doc.text(`PHP ${formatMoney(subtotal)}`, r - 1, y, { align: "right" });
    y += 3.5;

    if (hasAdditionalCharge) {
      const chargeAmount =
        data.additionalChargeType === "percent"
          ? subtotal * ((data.additionalChargeValue || 0) / 100)
          : data.additionalChargeValue || 0;
      const chargeLabel = data.additionalChargeDesc
        ? data.additionalChargeDesc
        : data.additionalChargeType === "percent"
          ? `Additional (${data.additionalChargeValue}%)`
          : "Additional Charge";
      doc.text(chargeLabel, l, y);
      doc.text(`+PHP ${formatMoney(chargeAmount)}`, r - 1, y, {
        align: "right",
      });
      y += 3.5;
    }

    if (hasDiscount) {
      const discountAmount =
        data.discountType === "percent"
          ? subtotal * ((data.discountValue || 0) / 100)
          : data.discountValue || 0;
      const discLabel = data.discountDesc
        ? data.discountDesc
        : data.discountType === "percent"
          ? `Discount (${data.discountValue}%)`
          : "Discount";
      doc.text(discLabel, l, y);
      doc.text(`-PHP ${formatMoney(discountAmount)}`, r - 1, y, {
        align: "right",
      });
      y += 3.5;
    }
  }

  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(253, 118, 26);
  doc.text("GRAND TOTAL", l, y);
  y += 4;
  doc.setFontSize(9.5);
  doc.text(`PHP ${formatMoney(data.grandTotal)}`, r - 1, y, { align: "right" });
  y += 7;

  // --- Footer ---
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(l, y, r, y);
  y += 4;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Thank you for your purchase!", cx, y, { align: "center" });
  y += 4;
  if (data.isCredit) {
    doc.setFont("courier", "bold");
    doc.setTextColor(253, 118, 26);
    doc.text("CREDIT SALE", cx, y, { align: "center" });
    y += 4;
    doc.setFont("courier", "normal");
    doc.setTextColor(100, 116, 139);
  }
  doc.setTextColor(100, 116, 139);
  doc.text(`${COMPANY}  |  Receipt #${data.receiptNumber}`, cx, y, {
    align: "center",
  });
  y += 3.5;
  doc.text(`(c) ${new Date().getFullYear()} ${COMPANY}`, cx, y, {
    align: "center",
  });

  // Force last page height
  const finalHeight = y + 10;
  if (finalHeight > 400) {
    (doc as any).internal.pageSize.height = finalHeight;
  }

  doc.save(`receipt-${data.receiptNumber}.pdf`);
}
