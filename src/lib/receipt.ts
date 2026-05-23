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
      &copy; ${new Date().getFullYear()} AnvilOS &middot; CWL Hardware
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
