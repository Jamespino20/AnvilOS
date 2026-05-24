/**
 * @fileoverview Receipt generation utilities – HTML print view and PDF download using jsPDF
 */

import { jsPDF } from "jspdf";

export function generateReceiptHtml(data: {
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
}): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px dashed #e2e8f0;font-size:12px">${item.productName}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #e2e8f0;font-size:12px;text-align:center">${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #e2e8f0;font-size:12px;text-align:right">₱${item.unitPrice.toLocaleString()}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #e2e8f0;font-size:12px;text-align:right">₱${item.totalPrice.toLocaleString()}</td>
      </tr>`,
    )
    .join("");

  const txnLabel =
    {
      SaleWalkIn: "Sale (Walk-In)",
      SalePO: "Sale (P.O.)",
      Return: "Return",
      Restock: "Restock",
      Adjustment: "Adjustment",
      Damage: "Damage",
    }[data.transactionType] || data.transactionType;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${data.receiptNumber}</title>
  <style>
    @page { margin: 0; }
    body { font-family: 'Courier New', monospace; margin: 0; padding: 0; color: #0e212c; }
    .receipt { max-width: 320px; margin: 0 auto; padding: 24px 16px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #fd761a; padding-bottom: 16px; }
    .header h1 { font-size: 22px; font-weight: 900; letter-spacing: 2px; margin: 0; color: #0e212c; }
    .header .sub { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; }
    .header .details { font-size: 11px; color: #64748b; margin-top: 8px; }
    .section-title { font-size: 11px; font-weight: 700; color: #0e212c; margin-top: 14px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; text-align: left; padding: 4px 0; border-bottom: 2px solid #e2e8f0; }
    th.right { text-align: right; }
    .total-row td { padding: 8px 0; font-size: 14px; font-weight: 700; border-top: 2px solid #0e212c; }
    .total-row td:last-child { color: #fd761a; }
    .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .receipt { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt" id="receipt">
    <div class="header">
      <h1>CWL Hardware</h1>
      <div class="sub">Hardware &amp; Supply</div>
      <div class="details">Receipt #${data.receiptNumber}<br>${data.date.toLocaleString("en-PH")}<br>Seller: ${data.sellerName}</div>
    </div>

    <div class="section-title">Buyer</div>
    <p style="font-size:12px;margin:4px 0">${data.buyerName}</p>
    ${data.buyerAddress ? `<p style="font-size:11px;color:#64748b;margin:2px 0">${data.buyerAddress}</p>` : ""}
    ${data.buyerContact ? `<p style="font-size:11px;color:#64748b;margin:2px 0">${data.buyerContact}</p>` : ""}

    <div class="section-title" style="margin-top:16px">Transaction</div>
    <p style="font-size:11px;color:#64748b;margin:4px 0">Type: ${txnLabel}${data.paymentMethod ? ` &middot; Payment: ${data.paymentMethod}` : ""}</p>

    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="right" style="text-align:center">Qty</th>
          <th class="right">Price</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3">GRAND TOTAL</td>
          <td style="text-align:right">₱${data.grandTotal.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">
      Thank you for your purchase!<br>
      &copy; ${new Date().getFullYear()} CWL Hardware
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 300); };
  </script>
</body>
</html>`;
}

export function downloadReceipt(data: {
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
  const html = generateReceiptHtml(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Open in a new tab; the page auto-triggers window.print() for Save as PDF
  const w = window.open(url, "_blank");
  if (!w) {
    // Fallback: direct download as .html if popup blocked
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${data.receiptNumber}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function downloadReceiptPdf(data: {
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

  const pageWidth = 80;
  const left = 5;
  const right = pageWidth - 5;
  const center = pageWidth / 2;

  let y = 10;

  // --- Header ---
  doc.setFont("courier", "bold");
  doc.setFontSize(16);
  doc.text("CWL HARDWARE", center, y, { align: "center" });
  y += 6;

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text("Hardware & Supply", center, y, { align: "center" });
  y += 4;

  doc.setFontSize(7);
  doc.text("123 Hardware Street, Manila", center, y, { align: "center" });
  y += 3.5;
  doc.text("Tel: (02) 8123-4567", center, y, { align: "center" });
  y += 5;

  // Separator
  doc.setDrawColor(0, 0, 0);
  doc.line(left, y, right, y);
  y += 4;

  // --- Receipt info ---
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.text(`Receipt #${data.receiptNumber}`, left, y);
  y += 4;
  doc.setFont("courier", "normal");
  doc.text(data.date.toLocaleString("en-PH"), left, y);
  y += 4;
  doc.text(`Seller: ${data.sellerName}`, left, y);
  y += 6;

  // --- Buyer ---
  doc.setFont("courier", "bold");
  doc.text("BUYER", left, y);
  y += 4;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(data.buyerName, left, y);
  y += 4;
  if (data.buyerAddress) {
    doc.text(data.buyerAddress, left, y);
    y += 4;
  }
  if (data.buyerContact) {
    doc.text(data.buyerContact, left, y);
    y += 4;
  }
  y += 3;

  // --- Transaction ---
  const txnLabel: Record<string, string> = {
    SaleWalkIn: "Sale (Walk-In)",
    SalePO: "Sale (P.O.)",
    Return: "Return",
    Restock: "Restock",
    Adjustment: "Adjustment",
    Damage: "Damage",
  };

  doc.setFont("courier", "bold");
  doc.text("TRANSACTION", left, y);
  y += 4;
  doc.setFont("courier", "normal");
  doc.text(`Type: ${txnLabel[data.transactionType] || data.transactionType}`, left, y);
  y += 4;
  if (data.paymentMethod) {
    doc.text(`Payment: ${data.paymentMethod}`, left, y);
    y += 4;
  }
  y += 3;

  // --- Items ---
  doc.setFont("courier", "bold");
  doc.text("ITEMS", left, y);
  y += 2;
  doc.line(left, y, right, y);
  y += 1;

  // Column headers
  doc.setFontSize(7);
  doc.setFont("courier", "bold");
  doc.text("Item", left, y);
  doc.text("Qty", 45, y, { align: "center" });
  doc.text("Price", 58, y, { align: "right" });
  doc.text("Total", right, y, { align: "right" });
  y += 1;
  doc.line(left, y, right, y);
  y += 3;

  // Items
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  for (const item of data.items) {
    const name =
      item.productName.length > 18
        ? item.productName.substring(0, 17) + "&"
        : item.productName;
    doc.text(name, left, y);
    doc.text(String(item.quantity), 45, y, { align: "center" });
    doc.text(`PHP${item.unitPrice.toLocaleString()}`, 58, y, { align: "right" });
    doc.text(`PHP${item.totalPrice.toLocaleString()}`, right, y, { align: "right" });
    y += 4;
  }

  // Grand total
  y += 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(left, y, right, y);
  y += 2;
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text("GRAND TOTAL", left, y);
  doc.text(`PHP${data.grandTotal.toLocaleString()}`, right, y, { align: "right" });
  y += 7;

  // --- Footer ---
  doc.line(left, y, right, y);
  y += 4;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text("Thank you for your purchase!", center, y, { align: "center" });
  y += 4;
  doc.text(`(c) ${new Date().getFullYear()} CWL Hardware`, center, y, { align: "center" });

  doc.save(`receipt-${data.receiptNumber}.pdf`);
}
