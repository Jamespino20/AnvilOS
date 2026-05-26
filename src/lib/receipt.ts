/**
 * @fileoverview Receipt generation utilities – PDF download using jsPDF
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

export async function downloadReceipt(data: Parameters<typeof downloadReceiptPdf>[0]) {
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

  // Logo — maintain aspect ratio on 80mm receipt
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
    await new Promise((resolve) => { img.onload = resolve; });
    const aspect = img.naturalWidth / img.naturalHeight;
    const maxLogoW = 32;
    const maxLogoH = 14;
    let logoW = maxLogoW;
    let logoH = logoW / aspect;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = logoH * aspect;
    }
    doc.addImage(b64, "PNG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + 3;
  } catch {}

  doc.setTextColor(14, 33, 44);
  doc.setFont("courier", "bold");
  doc.setFontSize(18);
  doc.text(COMPANY, cx, y + 6, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Hardware & Supply", cx, y + 11, { align: "center" });
  doc.setFontSize(7);
  doc.text("123 Hardware Street, Manila", cx, y + 15, { align: "center" });
  doc.text("Tel: (02) 8123-4567", cx, y + 18.5, { align: "center" });
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
  doc.setFont("courier", "normal");
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
  doc.text(`Type: ${TXN_LABELS[data.transactionType] || data.transactionType}`, l, y);
  y += 4;
  if (data.paymentMethod) {
    doc.text(`Payment: ${data.paymentMethod}`, l, y);
    y += 4;
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
    const name = item.productName.length > 22 ? item.productName.substring(0, 21) + "\u2026" : item.productName;
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
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(253, 118, 26);
  doc.text("GRAND TOTAL", l, y);
  y += 3.5;
  doc.text(`₱${formatMoney(data.grandTotal)}`, r, y, { align: "right" });
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
  doc.setTextColor(100, 116, 139);
  doc.text(`${COMPANY}  |  Receipt #${data.receiptNumber}`, cx, y, { align: "center" });
  y += 3.5;
  doc.text(`(c) ${new Date().getFullYear()} ${COMPANY}`, cx, y, { align: "center" });

  // Force last page height
  const finalHeight = y + 10;
  if (finalHeight > 400) {
    (doc as any).internal.pageSize.height = finalHeight;
  }

  doc.save(`receipt-${data.receiptNumber}.pdf`);
}


