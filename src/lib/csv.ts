/**
 * @fileoverview CSV, XLSX, and PDF export utilities with styled output
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function stripExt(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}

function formatTitle(name: string): string {
  return stripExt(name)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const COMPANY_NAME = "CWL Hardware";
const THEME_BLUE = [14, 33, 44] as const;
const THEME_ORANGE = [253, 118, 26] as const;
const THEME_WHITE = [255, 255, 255] as const;

export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const now = new Date();
  const meta = [
    `# ${COMPANY_NAME} — ${formatTitle(filename)}`,
    `# Generated: ${now.toLocaleString("en-PH")}`,
    `# Columns: ${headers.length} | Rows: ${rows.length}`,
    `# File: ${stripExt(filename)}.csv`,
    "",
  ];
  const csv = [
    ...meta,
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportXLSX(filename: string, headers: string[], rows: string[][]) {
  const wb = XLSX.utils.book_new();

  // Header row
  const headerRow = headers.map((h, i) => {
    const cell: XLSX.CellObject = {
      v: h,
      t: "s",
      s: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        fill: { fgColor: { rgb: "0E212C" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } },
        },
      },
    };
    return cell;
  });

  const dataRows = rows.map((row, ri) =>
    row.map((cell, ci) => {
      const isAlternate = ri % 2 === 1;
      const c: XLSX.CellObject = {
        v: cell,
        t: "s",
        s: {
          font: { color: { rgb: isAlternate ? "1E293B" : "0E212C" }, sz: 10 },
          fill: isAlternate ? { fgColor: { rgb: "F8FAFC" } } : { fgColor: { rgb: "FFFFFF" } },
          alignment: { horizontal: ci === 0 ? "left" : "right", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } },
          },
        },
      };
      return c;
    }),
  );

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Auto column widths
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => (r[i] || "").length),
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
  });
  ws["!cols"] = colWidths;

  // Freeze header row
  ws["!freeze"] = { x: 0, y: 1 };

  // Metadata properties
  wb.Props = {
    Title: formatTitle(filename),
    Subject: `${COMPANY_NAME} Export`,
    Author: COMPANY_NAME,
    CreatedDate: new Date(),
  };

  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, stripExt(filename) + ".xlsx");
}

export function exportPDF(filename: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const title = formatTitle(filename);
  const now = new Date();

  // --- Header banner ---
  doc.setFillColor(...THEME_BLUE);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(...THEME_WHITE);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, 14, 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 21);

  // Orange accent line
  doc.setFillColor(...THEME_ORANGE);
  doc.rect(0, 28, pageWidth, 1.5, "F");

  // --- Metadata line ---
  doc.setTextColor(...THEME_BLUE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const meta = `Generated: ${now.toLocaleString("en-PH")}  |  ${headers.length} columns, ${rows.length} rows  |  ${stripExt(filename)}.pdf`;
  doc.text(meta, 14, 35);
  doc.setDrawColor(...THEME_BLUE);
  doc.setLineWidth(0.3);
  doc.line(14, 38, pageWidth - 14, 38);

  // --- Table ---
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 42,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [14, 33, 44],
    },
    headStyles: {
      fillColor: [...THEME_BLUE],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: Object.fromEntries(
      headers.map((_, i) => [String(i), { halign: i === 0 ? "left" : "right" } as const]),
    ),
    margin: { top: 42, right: 14, bottom: 20, left: 14 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${COMPANY_NAME}  |  ${title}  |  Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" },
      );
    },
  });

  doc.save(stripExt(filename) + ".pdf");
}
