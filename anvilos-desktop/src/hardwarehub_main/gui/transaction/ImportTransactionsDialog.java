package hardwarehub_main.gui.transaction;

import hardwarehub_main.util.IconUtil;
import java.awt.*;
import java.io.IOException;
import javax.swing.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import hardwarehub_main.dao.TransactionDAO;
import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.Product;
import hardwarehub_main.model.Transaction;
import hardwarehub_main.model.TransactionItem;
import hardwarehub_main.model.User;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.opencsv.CSVReader;

public class ImportTransactionsDialog extends JDialog {
    private JTextField tfFile;
    private JButton btnBrowse, btnImport, btnCancel;
    private JComboBox<String> cbFormat;
    private JFileChooser fileChooser;

    public ImportTransactionsDialog(Window owner) {
        super(owner, "Import Transactions", ModalityType.APPLICATION_MODAL);
        setLayout(new BorderLayout(10, 10));
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setSize(480, 200);
        setLocationRelativeTo(owner);
        
        ImageIcon logo = IconUtil.loadIcon("HardwareHub_Icon.png");
        setIconImage(logo.getImage());

        JPanel form = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridx = 0; gbc.gridy = 0;
        form.add(new JLabel("File:"), gbc);
        gbc.gridx = 1;
        tfFile = new JTextField(22);
        tfFile.setEditable(false);
        form.add(tfFile, gbc);
        gbc.gridx = 2;
        btnBrowse = new JButton("Browse...");
        form.add(btnBrowse, gbc);
        gbc.gridx = 0; gbc.gridy = 1;
        form.add(new JLabel("Format:"), gbc);
        gbc.gridx = 1;
        cbFormat = new JComboBox<>(new String[] {"XLSX (Excel)", "CSV (Comma-separated)"});
        form.add(cbFormat, gbc);

        add(form, BorderLayout.CENTER);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        btnImport = new JButton("Import");
        btnCancel = new JButton("Cancel");
        btnPanel.add(btnImport);
        btnPanel.add(btnCancel);
        add(btnPanel, BorderLayout.SOUTH);

        btnBrowse.addActionListener(e -> {
            String userHome = System.getProperty("user.home");
            File documentsDir = new File(userHome, "Documents");
            JFileChooser chooser = new JFileChooser(documentsDir);
            int result = chooser.showOpenDialog(this);
            if (result == JFileChooser.APPROVE_OPTION) {
                tfFile.setText(chooser.getSelectedFile().getAbsolutePath());
            }
        });
        btnCancel.addActionListener(e -> dispose());
        btnImport.addActionListener(e -> {
            String filePath = tfFile.getText().trim();
            String format = (String) cbFormat.getSelectedItem();

            if (filePath.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Please select a file to import.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            try {
                List<Transaction> importedTransactions;
                if (format.startsWith("XLSX")) {
                    importedTransactions = readXlsx(filePath);
                } else if (format.startsWith("CSV")) {
                    importedTransactions = readCsv(filePath);
                } else {
                     JOptionPane.showMessageDialog(this, "Unsupported file format.", "Error", JOptionPane.ERROR_MESSAGE);
                     return;
                }

                if (importedTransactions.isEmpty()) {
                    JOptionPane.showMessageDialog(this, "No transactions found in the file.", "Info", JOptionPane.INFORMATION_MESSAGE);
                    return;
                }

                int importedCount = 0;
                StringBuilder errors = new StringBuilder();
                
                for (Transaction txn : importedTransactions) {
                    try {
                        // Insert the main transaction first
                        int newTxnId = TransactionDAO.insertTransaction(txn);
                        if (newTxnId > 0) {
                            // Insert transaction items
                            for (TransactionItem item : txn.getTransactionItems()) {
                                item.setTransactionId(newTxnId); // Link item to the new transaction
                                if (TransactionDAO.insertTransactionItem(item)){
                                    importedCount++;
                                } else {
                                    errors.append("Failed to import item for transaction ").append(" (Buyer: ").append(txn.getBuyerName()).append(" on ").append(txn.getTransactionDate()).append("): ").append(item.getProductName()).append("\n");
                                }
                            }
                        } else {
                             errors.append("Failed to import transaction: ").append(txn.getBuyerName()).append(" on ").append(txn.getTransactionDate()).append("\n");
                        }
                    } catch (Exception ex) {
                         errors.append("Error processing transaction: ").append(txn.getBuyerName()).append(" on ").append(txn.getTransactionDate()).append(" - ").append(ex.getMessage()).append("\n");
                         Logger.getLogger(ImportTransactionsDialog.class.getName()).log(Level.SEVERE, "Error importing transaction", ex);
                    }
                }
                
                if (errors.length() > 0) {
                    JOptionPane.showMessageDialog(this, "Import completed with errors:\n" + errors.toString(), "Import Errors", JOptionPane.WARNING_MESSAGE);
                } else {
                    JOptionPane.showMessageDialog(this, importedCount + " transaction items imported successfully!");
                }
                // --- Audit log ---
                hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                int sellerId = user != null ? user.getSellerId() : 0;
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                String details = "Imported transactions from: " + filePath + " (" + format + ")";
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "StockMovementsPanel", "Import", details));

            } catch (Exception ex) {
                Logger.getLogger(ImportTransactionsDialog.class.getName()).log(Level.SEVERE, "Import failed", ex);
                JOptionPane.showMessageDialog(this, "Import failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
            }
            dispose();
        });
    }
    
    private List<Transaction> readXlsx(String filePath) throws IOException {
        List<Transaction> transactions = new ArrayList<>();
        try (FileInputStream fis = new FileInputStream(new File(filePath));
             Workbook workbook = new XSSFWorkbook(fis)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                throw new IOException("Empty sheet");
            }
            Row headerRow = rowIterator.next();  // Assume first row is header
            String[] expectedColumns = {"Transaction ID", "Date", "Type", "Products", "Quantity", "Unit Price", "Total Price", "Grand Total", "Buyer/Supplier", "Seller", "Delivery Method"};
            if (headerRow.getLastCellNum() != expectedColumns.length) {
                throw new IOException("File does not have exactly 11 columns");
            }
            for (int i = 0; i < expectedColumns.length; i++) {
                Cell cell = headerRow.getCell(i);
                if (cell == null || !cell.getStringCellValue().equals(expectedColumns[i])) {
                    throw new IOException("Column mismatch at index " + i + ": Expected '" + expectedColumns[i] + "'");
                }
            }
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                String productsStr = getCellStringValue(row, 3);  // Index 3 for Products
                String quantitiesStr = getCellStringValue(row, 4);  // Index 4 for Quantity
                String unitPricesStr = getCellStringValue(row, 5);  // Index 5 for Unit Price
                String totalPricesStr = getCellStringValue(row, 6);  // Index 6 for Total Price
                String[] products = productsStr.split("\\n");
                String[] quantities = quantitiesStr.split("\\n");
                String[] unitPrices = unitPricesStr.split("\\n");
                String[] totalPrices = totalPricesStr.split("\\n");
                Transaction txn = new Transaction();
                for (int j = 0; j < products.length; j++) {
                    TransactionItem item = new TransactionItem();
                    item.setProductName(products[j]);
                    item.setQuantity(Integer.parseInt(quantities[j]));
                    item.setUnitPrice(new BigDecimal(unitPrices[j]));
                    item.setTotalPrice(new BigDecimal(totalPrices[j]));
                    txn.addTransactionItem(item);  // Assuming a method to add items
                }
                txn.setTransactionStatus("Ongoing");
                transactions.add(txn);
            }
        }
        return transactions;
    }

    private List<Transaction> readCsv(String filePath) throws IOException {
        List<Transaction> transactions = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new FileReader(filePath))) {
            String[] header = reader.readNext();  // Read header
            String[] expectedColumns = {"Transaction ID", "Date", "Transaction Type", "Products", "Quantity", "Unit Price", "Total Price", "Grand Total", "Buyer/Supplier", "Seller", "Delivery Method"};
            if (header.length != expectedColumns.length) {
                throw new IOException("File does not have exactly 11 columns");
            }
            for (int i = 0; i < expectedColumns.length; i++) {
                if (!header[i].equals(expectedColumns[i])) {
                    throw new IOException("Column mismatch at index " + i + ": Expected '" + expectedColumns[i] + "'");
                }
            }
            String[] line;
            while ((line = reader.readNext()) != null) {
                String productsStr = line[3];  // Index 3 for Products
                String quantitiesStr = line[4];  // Index 4 for Quantity
                String unitPricesStr = line[5];  // Index 5 for Unit Price
                String totalPricesStr = line[6];  // Index 6 for Total Price
                String[] products = productsStr.split("\\n");
                String[] quantities = quantitiesStr.split("\\n");
                String[] unitPrices = unitPricesStr.split("\\n");
                String[] totalPrices = totalPricesStr.split("\\n");
                Transaction txn = new Transaction();
                for (int j = 0; j < products.length; j++) {
                    TransactionItem item = new TransactionItem();
                    item.setProductName(products[j]);
                    item.setQuantity(Integer.parseInt(quantities[j]));
                    item.setUnitPrice(new BigDecimal(unitPrices[j]));
                    item.setTotalPrice(new BigDecimal(totalPrices[j]));
                    txn.addTransactionItem(item);  // Assuming a method to add items
                }
                txn.setTransactionStatus("Ongoing");
                transactions.add(txn);
            }
        }
        return transactions;
    }

    private String getCellStringValue(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return "";
        }
        return cell.getStringCellValue();
    }
} 