/**
 * @fileoverview CSV, XLSX, and PDF export utilities with styled output
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { formatReportMoney } from "@/lib/format";

function stripExt(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}

function formatTitle(name: string): string {
  return stripExt(name)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const COMPANY_NAME = "CWL Hardware";
const COMPANY_TAGLINE = "Hardware & Supply";
const THEME_BLUE = [14, 33, 44] as const;
const THEME_ORANGE = [253, 118, 26] as const;
const THEME_WHITE = [255, 255, 255] as const;
const MONEY_HEADER_RE = /(price|total|sales|revenue|spent|cost|loss|returns|amount|gross|net)/i;

function sanitizeForPdf(value: string): string {
  return String(value)
    .replace(/±/g, "+/-")
    .replace(/[^ -~\d,.₱%]/g, "");
}

function reportRows(headers: string[], rows: string[][]) {
  return rows.map((row) =>
    row.map((cell, index) => {
      const sanitized = sanitizeForPdf(cell);
      if (!MONEY_HEADER_RE.test(headers[index] || "")) return sanitized;
      const cleaned = String(sanitized).replace(/[^\d.-]/g, "");
      if (!cleaned || Number.isNaN(Number(cleaned))) return sanitized;
      return formatReportMoney(Number(cleaned));
    }),
  );
}

export function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const now = new Date();
  const outputRows = reportRows(headers, rows);
  const meta = [
    `# ${COMPANY_NAME} — ${formatTitle(filename)}`,
    `# Generated: ${now.toLocaleString("en-PH")}`,
    `# Columns: ${headers.length} | Rows: ${outputRows.length}`,
    `# File: ${stripExt(filename)}.csv`,
    "",
  ];
  const csv = [
    ...meta,
    headers.join(","),
    ...outputRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function exportXLSX(filename: string, headers: string[], rows: string[][]) {
  const outputRows = reportRows(headers, rows);
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY_NAME;
  wb.title = formatTitle(filename);
  wb.created = new Date();

  const ws = wb.addWorksheet("Data");

  // --- Logo + Brand header row ---
  ws.mergeCells(1, 1, 2, headers.length);
  const brandCell = ws.getCell("A1");
  brandCell.value = `${COMPANY_NAME}  —  ${formatTitle(filename)}`;
  brandCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  brandCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E212C" } };
  brandCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 24;
  ws.getRow(2).height = 12;

  // Try to add logo image
  try {
    const logoResp = await fetch("/images/CWLHardware_Logo.png");
    const logoBlob = await logoResp.blob();
    const logoBuf = await logoBlob.arrayBuffer();
    const logoId = wb.addImage({ buffer: logoBuf as any, extension: "png" });
    ws.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 40, height: 36 },
    });
  } catch { console.warn("Logo not available, skipping in XLSX header"); }

  // Orange accent row (thin)
  ws.mergeCells(2, 1, 2, headers.length);
  const accentCell = ws.getCell("A2");
  accentCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFD761A" } };
  ws.getRow(2).height = 3;

  // --- Metadata row ---
  ws.mergeCells(3, 1, 3, headers.length);
  const metaCell = ws.getCell("A3");
  metaCell.value = `Generated: ${new Date().toLocaleString("en-PH")}  |  ${outputRows.length} rows`;
  metaCell.font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };
  metaCell.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(3).height = 20;

  // --- Header row ---
  const headerRow = ws.getRow(4);
  headerRow.height = 28;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E212C" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });

  // --- Data rows ---
  outputRows.forEach((row, ri) => {
    const excelRow = ws.getRow(ri + 5);
    excelRow.height = 22;
    const isAlternate = ri % 2 === 1;
    row.forEach((cell, ci) => {
      const c = excelRow.getCell(ci + 1);
      c.value = cell;
      c.font = {
        name: "Calibri",
        size: 10,
        color: { argb: isAlternate ? "FF1E293B" : "FF0E212C" },
      };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isAlternate ? "FFF8FAFC" : "FFFFFFFF" },
      };
      c.alignment = {
        horizontal: ci === 0 ? "left" : "right",
        vertical: "middle",
      };
      c.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // --- Column widths ---
  headers.forEach((h, i) => {
    const maxLen = Math.max(h.length, ...outputRows.map((r) => (r[i] || "").length));
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 14), 55);
  });

  // --- Freeze header ---
  ws.views = [{ state: "frozen", ySplit: 4, xSplit: 0 }];

  // --- Auto filter ---
  const lastCol = String.fromCharCode(64 + headers.length);
  ws.autoFilter = `A4:${lastCol}4`;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = stripExt(filename) + ".xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function exportPDF(filename: string, headers: string[], rows: string[][]) {
  const outputRows = reportRows(headers, rows);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  const title = formatTitle(filename);
  const now = new Date();

  // --- Header banner ---
  doc.setFillColor(...THEME_BLUE);
  doc.rect(0, 0, pw, 32, "F");
  doc.setFillColor(...THEME_WHITE);
  doc.roundedRect(10, 5, 24, 19, 2, 2, "F");

  // Logo — maintain aspect ratio
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
    const maxLogoW = 20;
    const maxLogoH = 15;
    let logoW = maxLogoW;
    let logoH = logoW / aspect;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = logoH * aspect;
    }
    doc.addImage(b64, "PNG", 12 + (maxLogoW - logoW) / 2, 7 + (maxLogoH - logoH) / 2, logoW, logoH);
  } catch { console.warn("Logo not available, skipping in PDF header"); }

  doc.setTextColor(...THEME_WHITE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CWL HARDWARE", 40, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_TAGLINE, 40, 19);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 27, { maxWidth: pw - 28 });

  // --- Orange accent line ---
  doc.setFillColor(...THEME_ORANGE);
  doc.rect(0, 32, pw, 1.5, "F");

  // --- Metadata line ---
  doc.setTextColor(...THEME_BLUE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const meta = `Generated: ${now.toLocaleString("en-PH")}  |  ${headers.length} columns, ${outputRows.length} rows`;
  doc.text(meta, 14, 39);
  doc.setDrawColor(...THEME_BLUE);
  doc.setLineWidth(0.3);
  doc.line(14, 42, pw - 14, 42);

  // --- Calculate proportional column widths ---
  const marginLeft = 14;
  const marginRight = 14;
  const usable = pw - marginLeft - marginRight;
  const minColWidth = 18;
  const maxColWidth = 62;

  const colWidths = headers.map((h, i) => {
    const maxContent = Math.max(
      h.length,
      ...outputRows.map((r) => (r[i] || "").length),
    );
    const isMoney = MONEY_HEADER_RE.test(h);
    return Math.min(maxColWidth, Math.max(isMoney ? 28 : minColWidth, maxContent * 2.2));
  });
  const totalWidth = colWidths.reduce((s, w) => s + w, 0);
  const scaled = colWidths.map((w) => Math.max(14, (w / totalWidth) * usable));

  // --- Table with column-specific widths ---
  const baseFontSize = headers.length > 8 ? 5.5 : headers.length > 6 ? 6 : 7;

  autoTable(doc, {
    head: [headers],
    body: outputRows,
    startY: 46,
    styles: {
      fontSize: baseFontSize,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [14, 33, 44],
      overflow: "linebreak",
      valign: "middle",
      minCellHeight: 7,
    },
    headStyles: {
      fillColor: [...THEME_BLUE],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: headers.length > 7 ? 7 : 8,
      halign: "center",
      overflow: "linebreak",
    },
    bodyStyles: {
      fontSize: headers.length > 7 ? 6.4 : 7,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: Object.fromEntries(
      headers.map((_, i) => [
        String(i),
        { halign: i === 0 ? "left" : "right", cellWidth: scaled[i], overflow: "linebreak" },
      ]),
    ),
    margin: { top: 46, right: marginRight, bottom: 20, left: marginLeft },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const cellText = String(data.cell.raw || "");
      const colWidth = scaled[data.column.index];
      doc.setFontSize(baseFontSize);
      const textWidth = doc.getTextWidth(cellText);
      if (textWidth > colWidth - 4 && baseFontSize > 4) {
        const newSize = Math.max(4, baseFontSize - 1.5);
        doc.setFontSize(newSize);
        data.cell.styles.fontSize = newSize;
      }
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${COMPANY_NAME}  |  ${title}  |  Page ${data.pageNumber} of ${pageCount}`,
        pw / 2,
        ph - 8,
        { align: "center" },
      );
    },
  });

  doc.save(stripExt(filename) + ".pdf");
}


