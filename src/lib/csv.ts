/**
 * @fileoverview CSV, XLSX, and PDF export utilities
 */

import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

function stripExt(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}

export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportXLSX(filename: string, headers: string[], rows: string[][]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, stripExt(filename) + ".xlsx");
}

export function exportPDF(filename: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableWidth = pageWidth - 2 * margin;
  const colWidth = usableWidth / headers.length;
  const cellHeight = 7;

  let y = 20;

  // Title
  const title = stripExt(filename).replace(/[-_]/g, " ");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title.charAt(0).toUpperCase() + title.slice(1), pageWidth / 2, y, { align: "center" });
  y += 8;

  // Generation timestamp
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString("en-PH")}`, margin, y);
  y += 7;

  function truncate(text: string, maxChars: number): string {
    return text.length > maxChars ? text.substring(0, maxChars - 1) + "\u2026" : text;
  }

  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setFillColor(14, 33, 44);
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => {
      const x = margin + i * colWidth;
      doc.rect(x, y, colWidth, cellHeight, "F");
      doc.text(truncate(h, Math.floor(colWidth / 1.4)), x + 1, y + 5);
    });
    y += cellHeight;
  }

  function drawRow(row: string[]) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(14, 33, 44);
    row.forEach((cell, i) => {
      const x = margin + i * colWidth;
      doc.rect(x, y, colWidth, cellHeight, "S");
      doc.text(truncate(cell, Math.floor(colWidth / 1.3)), x + 1, y + 5);
    });
    y += cellHeight;
  }

  drawHeader();

  for (const row of rows) {
    if (y > 275) {
      doc.addPage();
      y = 20;
      drawHeader();
    }
    drawRow(row);
  }

  doc.save(stripExt(filename) + ".pdf");
}
