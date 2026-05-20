package hardwarehub_main.gui.pos;

import hardwarehub_main.model.Transaction;
import hardwarehub_main.model.TransactionItem;
import hardwarehub_main.model.User;
import hardwarehub_main.model.Product;
import hardwarehub_main.dao.ProductDAO;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import javax.swing.*;
import java.awt.Desktop;
import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import hardwarehub_main.util.IconUtil;
import com.itextpdf.text.Document;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Element;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.PageSize;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import java.io.File;
import java.io.FileOutputStream;

public class ReceiptGenerator {
    private static int currentTransactionId;

    /**
     * Generates a receipt PDF for the given transaction and items.
     * @return the File of the generated receipt, or null if error
     */
    public static File generateReceipt(Transaction txn, List<TransactionItem> items, User seller, JFrame parent) {
        try {
            // Set current transaction ID for net sales calculation
            currentTransactionId = txn.getTransactionId();
            
            // Platform-independent Documents/HardwareHub/Receipts directory
            String userHome = System.getProperty("user.home");
            Path receiptsDir = Paths.get(userHome, "Documents", "HardwareHub", "Receipts");
            if (!Files.exists(receiptsDir)) Files.createDirectories(receiptsDir);
            String dateStr = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String buyerNameSafe = txn.getBuyerName() != null ? txn.getBuyerName().replaceAll("[^a-zA-Z0-9]", "_") : "Unknown";
            String statusSafe = txn.getTransactionStatus() != null ? txn.getTransactionStatus().replaceAll("[^a-zA-Z0-9]", "_") : "Unknown";
            String filename = buyerNameSafe + "_receipt_" + statusSafe + "_" + dateStr + ".pdf";
            File receiptFile = receiptsDir.resolve(filename).toFile();

            // --- PDF Generation ---
            Document doc = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(doc, new FileOutputStream(receiptFile));
            doc.open();

            // --- Logos using IconUtil ---
            PdfPTable logoTable = new PdfPTable(2);
            logoTable.setWidthPercentage(100);
            logoTable.setWidths(new int[]{1, 2});
            
            // Left: Large CWLHardware_Logo
            PdfPCell left = new PdfPCell();
            left.setBorder(Rectangle.NO_BORDER);
            ImageIcon cwlLogoIcon = IconUtil.loadIcon("CWLHardware_Logo.png");
            if (cwlLogoIcon != null) {
                com.itextpdf.text.Image cwlLogo = com.itextpdf.text.Image.getInstance(cwlLogoIcon.getImage(), null);
                cwlLogo.scaleToFit(140, 140); // Larger size
                left.addElement(cwlLogo);
            }
            logoTable.addCell(left);
            
            // Right: Made with: [HardwareHub_Logo] horizontally, both larger
            PdfPCell right = new PdfPCell();
            right.setBorder(Rectangle.NO_BORDER);
            Paragraph madeWith = new Paragraph("Made with:");
            madeWith.setAlignment(Element.ALIGN_LEFT);
            right.addElement(madeWith);
            ImageIcon hubLogoIcon = IconUtil.loadIcon("HardwareHub_Logo.png");
            if (hubLogoIcon != null) {
                com.itextpdf.text.Image hubLogo = com.itextpdf.text.Image.getInstance(hubLogoIcon.getImage(), null);
                hubLogo.scaleToFit(120, 120); // Larger size
                hubLogo.setAlignment(Element.ALIGN_LEFT);
                right.addElement(hubLogo);
            }
            logoTable.addCell(right);
            doc.add(logoTable);

            // --- Header ---
            Paragraph header = new Paragraph("208 CUTCOT, PULILAN, BULACAN\nVAT REG. TIN: 224-710-770-00000", new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD));
            header.setAlignment(Element.ALIGN_CENTER);
            doc.add(header);
            doc.add(Chunk.NEWLINE);

            // --- Transaction Info ---
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new int[]{1, 2});
            infoTable.addCell(getCell("Receipt Number:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(String.format("%08d", txn.getReceiptNumber()), PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Seller:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(txn.getSellerName(), PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Date:", PdfPCell.ALIGN_RIGHT));
            String txnDateStr = txn.getTransactionDate() != null ? txn.getTransactionDate().toString() : "";
            infoTable.addCell(getCell(txnDateStr, PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Transaction Type:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(txn.getTransactionType(), PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Delivered to:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(txn.getBuyerName(), PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Contact:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(txn.getBuyerContact(), PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Address:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(txn.getBuyerAddress(), PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Delivery Method:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(txn.getDeliveryMethod(), PdfPCell.ALIGN_LEFT));
            infoTable.addCell(getCell("Transaction Status:", PdfPCell.ALIGN_RIGHT));
            infoTable.addCell(getCell(txn.getTransactionStatus(), PdfPCell.ALIGN_LEFT));
            doc.add(infoTable);
            doc.add(Chunk.NEWLINE);

            // --- Order Table ---
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new int[]{3, 2, 1, 2, 2});
            addTableHeader(table, new String[]{"Product", "Category", "Qty", "Unit Price", "Total"});
            for (TransactionItem item : items) {
                Product product = ProductDAO.getProductById(item.getProductId());
                String category = (product != null) ? product.getCategory() : "";
                table.addCell(item.getProductName());
                table.addCell(category);
                table.addCell(String.valueOf(item.getQuantity()));
                table.addCell(item.getUnitPrice() != null ? item.getUnitPrice().toPlainString() : "");
                table.addCell(item.getTotalPrice() != null ? item.getTotalPrice().toPlainString() : "");
            }
            doc.add(table);
            doc.add(Chunk.NEWLINE);

            // After doc.add(table);, add grand total
            Paragraph grandTotal = new Paragraph("Grand Total: " + (txn.getGrandTotal() != null ? txn.getGrandTotal().toPlainString() : ""), new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD));
            grandTotal.setAlignment(Element.ALIGN_RIGHT);
            doc.add(grandTotal);

            // --- Signature ---
            Paragraph received = new Paragraph("Received the above goods in good condition.\nBy: ____________________________________\n    Customer Signature Over Printed Name    ", new Font(Font.FontFamily.HELVETICA, 11));
            received.setAlignment(Element.ALIGN_RIGHT);
            doc.add(received);
            doc.add(Chunk.NEWLINE);

            // --- Footer ---
            Paragraph footer = new Paragraph("*THIS RECEIPT IS MADE BY JCBP SOLUTIONS © 2025.*\n*THIS RECEIPT IS NOT AN OFFICIALLY ACCREDITED PRINT AND ONLY SERVES AS REFERENCE MATERIAL.*", new Font(Font.FontFamily.HELVETICA, 9, Font.ITALIC));
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return receiptFile;
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(parent, "Failed to generate receipt: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
            return null;
        }
    }

    private static PdfPCell getCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text));
        cell.setPadding(4);
        cell.setHorizontalAlignment(alignment);
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    private static void addTableHeader(PdfPTable table, String[] headers) {
        for (String col : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(col, new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD)));
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    // Compute the net sales for a product (sales - returns) for return validation
    private static int getNetSales(int productId) {
        int netSales = 0;
        List<Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        for (Transaction txn : txns) {
            // Skip the current transaction to avoid double counting
            if (txn.getTransactionId() == currentTransactionId) continue;
            
            List<TransactionItem> items = hardwarehub_main.dao.TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
            for (TransactionItem item : items) {
                if (item.getProductId() != productId) continue;
                String type = txn.getTransactionType();
                if (type.equals("Sale Walk-In") || type.equals("Sale PO")) netSales += item.getQuantity();
                if (type.equals("Return")) netSales -= item.getQuantity();
            }
        }
        return netSales;
    }
} 