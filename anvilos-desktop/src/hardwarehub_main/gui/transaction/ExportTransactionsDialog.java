package hardwarehub_main.gui.transaction;

import hardwarehub_main.util.IconUtil;
import java.awt.*;
import javax.swing.*;
import hardwarehub_main.dao.TransactionDAO;
import hardwarehub_main.model.Transaction;
import hardwarehub_main.model.TransactionItem;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.opencsv.CSVWriter;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import java.io.*;
import java.util.*;
import java.text.SimpleDateFormat;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Picture;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.BaseColor;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.FillPatternType;
import com.itextpdf.text.Font;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Element;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Document;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfPCell;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.CreationHelper;
import com.itextpdf.text.Image;
import com.toedter.calendar.JDateChooser;
import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.Product;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.time.LocalDate;
import java.util.stream.Collectors;
import org.apache.poi.ss.util.CellRangeAddress;

public class ExportTransactionsDialog extends JDialog {

    private JTextField tfFile;
    private JButton btnBrowse, btnExport, btnCancel;
    private JComboBox<String> cbFormat;
    private JFileChooser fileChooser;
    private java.util.List<Transaction> transactionsFromPanel; // Transactions from the calling panel (e.g., StockMovementsPanel)
    private JRadioButton rbAll, rbCurrent, rbCustom;
    private ButtonGroup exportGroup;
    private JPanel customPanel;
    private JDateChooser dcFrom, dcTo;
    private JComboBox<String> cbType;
    private JTextField tfBuyerNameFilter;
    private java.util.List<Transaction> allTransactions;
    private java.util.Set<Integer> selectedCategoryIds = new java.util.HashSet<>();
    private java.util.Set<Integer> selectedProductIds = new java.util.HashSet<>();
    private JComboBox<String> cbStatus;

    public ExportTransactionsDialog(Window owner, java.util.List<Transaction> transactionsFromPanel) {
        super(owner, "Export Transactions", ModalityType.APPLICATION_MODAL);
        this.transactionsFromPanel = transactionsFromPanel;
        setLayout(new BorderLayout(10, 10));
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setSize(550, 400);
        setLocationRelativeTo(owner);

        ImageIcon logo = IconUtil.loadIcon("HardwareHub_Icon.png");
        setIconImage(logo.getImage());

        // Mode panel with improved styling
        JPanel modePanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        modePanel.setBorder(BorderFactory.createTitledBorder("Export Mode"));  // Add title for consistency
        rbAll = new JRadioButton("All Transactions");
        rbCurrent = new JRadioButton("Current Table View");
        rbCustom = new JRadioButton("Custom Filter");
        exportGroup = new ButtonGroup();
        exportGroup.add(rbAll);
        exportGroup.add(rbCurrent);
        exportGroup.add(rbCustom);
        rbCustom.setSelected(true);  // Default to current for better UX
        modePanel.add(rbAll);
        modePanel.add(rbCurrent);
        modePanel.add(rbCustom);
        add(modePanel, BorderLayout.NORTH);

        // Custom panel (now always visible, renamed to Data Filter)
        customPanel = new JPanel(new GridBagLayout());
        customPanel.setBorder(BorderFactory.createTitledBorder("Data Filter"));  // Renamed header
        GridBagConstraints gbcCustom = new GridBagConstraints();
        gbcCustom.insets = new Insets(5, 5, 5, 5);
        gbcCustom.anchor = GridBagConstraints.WEST;
        gbcCustom.fill = GridBagConstraints.HORIZONTAL;

        gbcCustom.gridx = 0;
        gbcCustom.gridy = 0;
        customPanel.add(new JLabel("Date from:"), gbcCustom);
        gbcCustom.gridx = 1;
        dcFrom = new JDateChooser();
        dcFrom.setDateFormatString("yyyy-MM-dd");
        customPanel.add(dcFrom, gbcCustom);

        gbcCustom.gridx = 2;
        gbcCustom.gridy = 0;
        customPanel.add(new JLabel("to:"), gbcCustom);
        gbcCustom.gridx = 3;
        dcTo = new JDateChooser();
        dcTo.setDateFormatString("yyyy-MM-dd");
        customPanel.add(dcTo, gbcCustom);

        gbcCustom.gridx = 0;
        gbcCustom.gridy = 1;
        customPanel.add(new JLabel("Type:"), gbcCustom);
        gbcCustom.gridx = 1;
        gbcCustom.gridwidth = 3;
        cbType = new JComboBox<>();
        cbType.addItem("All");
        allTransactions = TransactionDAO.getAllTransactions(); // Fetch all once for types
        java.util.Set<String> types = allTransactions.stream()
                .map(Transaction::getTransactionType)
                .filter(Objects::nonNull) // Filter out null types
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
        for (String t : types) {
            cbType.addItem(t);
        }
        customPanel.add(cbType, gbcCustom);

        gbcCustom.gridx = 0;
        gbcCustom.gridy = 2;
        gbcCustom.gridwidth = 1;
        customPanel.add(new JLabel("Buyer Name:"), gbcCustom);
        gbcCustom.gridx = 1;
        gbcCustom.gridwidth = 3;
        tfBuyerNameFilter = new JTextField(20);
        customPanel.add(tfBuyerNameFilter, gbcCustom);

        gbcCustom.gridx = 0;
        gbcCustom.gridy = 3;
        gbcCustom.gridwidth = 1;
        JButton btnCategoryFilter = new JButton("Filter Categories...");
        customPanel.add(btnCategoryFilter, gbcCustom);
        gbcCustom.gridx = 1;
        gbcCustom.gridwidth = 3;
        JLabel lblSelectedCategories = new JLabel("All Categories");
        customPanel.add(lblSelectedCategories, gbcCustom);

        // Add status filter to customPanel
        gbcCustom.gridx = 0;
        gbcCustom.gridy = 5;
        gbcCustom.gridwidth = 1;
        customPanel.add(new JLabel("Status:"), gbcCustom);
        gbcCustom.gridx = 1;
        gbcCustom.gridwidth = 3;
        cbStatus = new JComboBox<>(new String[]{"All", "Ongoing", "Completed", "Cancelled"});
        customPanel.add(cbStatus, gbcCustom);

        // Store selected category IDs
        java.util.Set<Integer> selectedCategoryIds = new java.util.HashSet<>();

        btnCategoryFilter.addActionListener(e -> {
            java.util.List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
            java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory = new java.util.HashMap<>();
            for (hardwarehub_main.model.Category c : categories) {
                idToCategory.put(c.getCategoryId(), c);
            }
            // Build indented list
            java.util.List<hardwarehub_main.model.Category> roots = new java.util.ArrayList<>();
            for (hardwarehub_main.model.Category c : categories) {
                if (c.getParentCategoryId() == null) {
                    roots.add(c);
                }
            }
            JPanel panel = new JPanel();
            panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
            java.util.List<JCheckBox> checkboxes = new java.util.ArrayList<>();
            JCheckBox selectAll = new JCheckBox("Select All");
            panel.add(selectAll);
            java.util.function.BiConsumer<java.util.List<hardwarehub_main.model.Category>, Integer> addIndented = new java.util.function.BiConsumer<>() {
                @Override
                public void accept(java.util.List<hardwarehub_main.model.Category> cats, Integer level) {
                    for (hardwarehub_main.model.Category cat : cats) {
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < level; i++) {
                            sb.append("    ");
                        }
                        sb.append(cat.getCategory());
                        JCheckBox cb = new JCheckBox(sb.toString());
                        cb.setSelected(selectedCategoryIds.isEmpty() || selectedCategoryIds.contains(cat.getCategoryId()));
                        cb.putClientProperty("catId", cat.getCategoryId());
                        checkboxes.add(cb);
                        panel.add(cb);
                        // Find children
                        java.util.List<hardwarehub_main.model.Category> children = new java.util.ArrayList<>();
                        for (hardwarehub_main.model.Category c2 : categories) {
                            if (cat.getCategoryId() == (c2.getParentCategoryId() != null ? c2.getParentCategoryId() : -1)) {
                                children.add(c2);
                            }
                        }
                        accept(children, level + 1);
                    }
                }
            };
            addIndented.accept(roots, 0);
            selectAll.addActionListener(ev -> {
                boolean sel = selectAll.isSelected();
                for (JCheckBox cb : checkboxes) {
                    cb.setSelected(sel);
                }
            });
            int result = JOptionPane.showConfirmDialog(this, new JScrollPane(panel), "Select Categories", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
            if (result == JOptionPane.OK_OPTION) {
                selectedCategoryIds.clear();
                java.util.List<String> selectedNames = new java.util.ArrayList<>();
                for (JCheckBox cb : checkboxes) {
                    if (cb.isSelected()) {
                        Integer catId = (Integer) cb.getClientProperty("catId");
                        selectedCategoryIds.add(catId);
                        selectedNames.add(cb.getText().trim());
                    }
                }
                if (selectedCategoryIds.isEmpty() || selectedCategoryIds.size() == checkboxes.size()) {
                    lblSelectedCategories.setText("All Categories");
                } else {
                    lblSelectedCategories.setText(String.join(", ", selectedNames));
                }
            }
        });

        // Add after category filter in customPanel
        gbcCustom.gridx = 0;
        gbcCustom.gridy = 4;
        gbcCustom.gridwidth = 1;
        JButton btnProductFilter = new JButton("Filter Products...");
        customPanel.add(btnProductFilter, gbcCustom);
        gbcCustom.gridx = 1;
        gbcCustom.gridwidth = 3;
        JLabel lblSelectedProducts = new JLabel("All Products");
        JScrollPane scrollSelectedProducts = new JScrollPane(lblSelectedProducts, JScrollPane.VERTICAL_SCROLLBAR_NEVER, JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
        scrollSelectedProducts.setPreferredSize(new java.awt.Dimension(0, 36));
        scrollSelectedProducts.setMinimumSize(new java.awt.Dimension(0, 36));
        scrollSelectedProducts.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 36));
        customPanel.add(scrollSelectedProducts, gbcCustom);

        btnProductFilter.addActionListener(e -> {
            java.util.List<Product> allProducts = ProductDAO.getAllProducts();
            java.util.List<hardwarehub_main.model.Category> allCategories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
            java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory = new java.util.HashMap<>();
            for (hardwarehub_main.model.Category c : allCategories) {
                idToCategory.put(c.getCategoryId(), c);
            }
            java.util.List<Product> filteredProducts = new java.util.ArrayList<>();
            if (selectedCategoryIds.isEmpty()) {
                for (Product p : allProducts) {
                    hardwarehub_main.model.Category cat = idToCategory.get(p.getCategoryId());
                    if (cat != null && cat.isAvailable()) {
                        filteredProducts.add(p);
                    }
                }
            } else {
                for (Product p : allProducts) {
                    hardwarehub_main.model.Category cat = idToCategory.get(p.getCategoryId());
                    if (cat != null && cat.isAvailable() && selectedCategoryIds.contains(p.getCategoryId())) {
                        filteredProducts.add(p);
                    }
                }
            }
            JPanel panel = new JPanel();
            panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
            java.util.List<JCheckBox> checkboxes = new java.util.ArrayList<>();
            JCheckBox selectAll = new JCheckBox("Select All");
            panel.add(selectAll);
            for (Product p : filteredProducts) {
                String display = p.getProductName() + " (" + p.getSupplierName() + ")";
                JCheckBox cb = new JCheckBox(display);
                cb.setSelected(selectedProductIds.isEmpty() || selectedProductIds.contains(p.getProductId()));
                cb.putClientProperty("prodId", p.getProductId());
                checkboxes.add(cb);
                panel.add(cb);
            }
            selectAll.addActionListener(ev -> {
                boolean sel = selectAll.isSelected();
                for (JCheckBox cb : checkboxes) {
                    cb.setSelected(sel);
                }
            });
            int result = JOptionPane.showConfirmDialog(this, new JScrollPane(panel), "Select Products", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
            if (result == JOptionPane.OK_OPTION) {
                selectedProductIds.clear();
                java.util.List<String> selectedNames = new java.util.ArrayList<>();
                for (JCheckBox cb : checkboxes) {
                    if (cb.isSelected()) {
                        Integer prodId = (Integer) cb.getClientProperty("prodId");
                        selectedProductIds.add(prodId);
                        selectedNames.add(cb.getText().trim());
                    }
                }
                // Improved label logic
                if (selectedProductIds.size() == checkboxes.size() && checkboxes.size() > 0) {
                    lblSelectedProducts.setText("All Products");
                } else if (selectedProductIds.size() == 1) {
                    lblSelectedProducts.setText(selectedNames.get(0));
                } else if (selectedProductIds.size() > 1 && selectedProductIds.size() <= 3) {
                    lblSelectedProducts.setText(String.join(", ", selectedNames));
                } else if (selectedProductIds.size() > 3) {
                    lblSelectedProducts.setText(selectedProductIds.size() + " products selected");
                } else {
                    lblSelectedProducts.setText("No Products");
                }
            }
        });

        add(customPanel, BorderLayout.CENTER);  // Always add to layout

        // --- Enable/disable category/product filters based on mode ---
        Runnable updateFilterEnabling = () -> {
            boolean custom = rbCustom.isSelected();
            btnCategoryFilter.setEnabled(custom);
            lblSelectedCategories.setEnabled(custom);
            btnProductFilter.setEnabled(custom);
            lblSelectedProducts.setEnabled(custom);
            cbStatus.setEnabled(custom);
        };
        rbAll.addActionListener(e -> updateFilterEnabling.run());
        rbCurrent.addActionListener(e -> updateFilterEnabling.run());
        rbCustom.addActionListener(e -> updateFilterEnabling.run());
        updateFilterEnabling.run();

        // Add back the form panel for file and format
        JPanel formPanel = new JPanel(new GridBagLayout());
        formPanel.setBorder(BorderFactory.createTitledBorder("Export Options"));  // Title for this section
        GridBagConstraints gbcForm = new GridBagConstraints();
        gbcForm.insets = new Insets(8, 8, 8, 8);
        gbcForm.anchor = GridBagConstraints.WEST;
        gbcForm.fill = GridBagConstraints.HORIZONTAL;
        gbcForm.gridx = 0;
        gbcForm.gridy = 0;
        formPanel.add(new JLabel("File:"), gbcForm);
        gbcForm.gridx = 1;
        tfFile = new JTextField(22);
        tfFile.setEditable(false);
        formPanel.add(tfFile, gbcForm);
        gbcForm.gridx = 2;
        btnBrowse = new JButton("Browse...");
        formPanel.add(btnBrowse, gbcForm);
        gbcForm.gridx = 0;
        gbcForm.gridy = 1;
        formPanel.add(new JLabel("Format:"), gbcForm);
        gbcForm.gridx = 1;
        cbFormat = new JComboBox<>(new String[]{"XLSX (Excel)", "CSV (Comma-separated)", "PDF (PDF Document)"});
        formPanel.add(cbFormat, gbcForm);
        add(formPanel, BorderLayout.SOUTH);  // Place it below customPanel, but adjust as needed

        // Set default export directory and file chooser
        String userHome = System.getProperty("user.home");
        Path exportDir = Paths.get(userHome, "Documents", "HardwareHub", "Exports", "Transactions");
        if (!Files.exists(exportDir)) try {
            Files.createDirectories(exportDir);
        } catch (IOException ex) {
            Logger.getLogger(ExportTransactionsDialog.class.getName()).log(Level.SEVERE, "Error creating export directory", ex);
        }
        fileChooser = new JFileChooser(exportDir.toFile());
        String defaultFileName = "transactions_export_" + new SimpleDateFormat("yyyyMMdd").format(new Date());
        fileChooser.setSelectedFile(new File(fileChooser.getCurrentDirectory(), defaultFileName));
        tfFile.setText(fileChooser.getSelectedFile().getAbsolutePath());

        btnBrowse.addActionListener(e -> {
            String selectedFormat = (String) cbFormat.getSelectedItem();
            String extension = "xlsx";
            if (selectedFormat.startsWith("CSV")) {
                extension = "csv";
            } else if (selectedFormat.startsWith("PDF")) {
                extension = "pdf";
            }
            fileChooser.setSelectedFile(new File(fileChooser.getCurrentDirectory(), "transactions_" + new SimpleDateFormat("yyyyMMdd").format(new Date()) + "." + extension));
            int result = fileChooser.showSaveDialog(this);
            if (result == JFileChooser.APPROVE_OPTION) {
                tfFile.setText(fileChooser.getSelectedFile().getAbsolutePath());
            }
        });

        // Export buttons panel (dynamic based on mode)
        JPanel exportButtonsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        exportButtonsPanel.setBorder(BorderFactory.createTitledBorder("Export Options"));
        JButton btnExportXlsx = new JButton("Export to XLSX");
        JButton btnExportCsv = new JButton("Export to CSV");
        JButton btnExportPdf = new JButton("Export to PDF");
        btnCancel = new JButton("Cancel");  // Initialize btnCancel here
        btnCancel.addActionListener(e -> dispose());  // Add action listener

        btnExportXlsx.addActionListener(e -> exportFile("XLSX", rbCustom.isSelected()));
        btnExportCsv.addActionListener(e -> exportFile("CSV", rbCustom.isSelected()));
        btnExportPdf.addActionListener(e -> exportFile("PDF", rbCustom.isSelected()));

        exportButtonsPanel.add(btnExportXlsx);
        exportButtonsPanel.add(btnExportCsv);
        exportButtonsPanel.add(btnExportPdf);
        exportButtonsPanel.add(btnCancel);  // Add btnCancel to the panel
        add(exportButtonsPanel, BorderLayout.SOUTH);
    }

    private java.util.List<Transaction> loadFilteredTransactions(java.util.Date fromDate, java.util.Date toDate, String type, String buyerName, String status) {
        java.util.List<Transaction> txns = TransactionDAO.getAllTransactions();
        LocalDate from = fromDate != null ? new java.sql.Date(fromDate.getTime()).toLocalDate() : null;
        LocalDate to = toDate != null ? new java.sql.Date(toDate.getTime()).toLocalDate() : null;
        return txns.stream()
                .filter(txn -> type.equals("All") || txn.getTransactionType().equalsIgnoreCase(type))
                .filter(txn -> buyerName.isEmpty() || (txn.getBuyerName() != null && txn.getBuyerName().toLowerCase().contains(buyerName.toLowerCase())))
                .filter(txn -> from == null || (txn.getTransactionDate() != null && !txn.getTransactionDate().isBefore(from)))
                .filter(txn -> to == null || (txn.getTransactionDate() != null && !txn.getTransactionDate().isAfter(to)))
                .filter(txn -> status.equals("All") || (txn.getTransactionStatus() != null && txn.getTransactionStatus().equalsIgnoreCase(status)))
                .filter(txn -> {
                    if (selectedCategoryIds.isEmpty() && selectedProductIds.isEmpty()) {
                        return true;
                    }
                    java.util.List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
                    boolean categoryMatch = !selectedCategoryIds.isEmpty() && items.stream().anyMatch(item -> selectedCategoryIds.contains(ProductDAO.getProductById(item.getProductId()).getCategoryId()));
                    boolean productMatch = !selectedProductIds.isEmpty() && items.stream().anyMatch(item -> selectedProductIds.contains(item.getProductId()));
                    return categoryMatch || productMatch;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    private static final String[] COLUMNS_XLSX_CSV = {
        "Transaction ID",
        "Date",
        "Transaction Type",
        "Products",
        "Quantity",
        "Unit Price",
        "Total Price",
        "Grand Total",
        "Buyer/Supplier",
        "Seller",
        "Delivery Method",
        "Transaction Status"
    };

    private static final String[] COLUMNS_PDF = COLUMNS_XLSX_CSV;  // Use the same for PDF consistency

    private void exportXlsx(String filePath, java.util.List<Transaction> txns) throws Exception {
        int confirm = JOptionPane.showConfirmDialog(this, "Export transactions to XLSX?", "Confirm Export", JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION) return;
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Transactions");
            // Visually obvious big header
            org.apache.poi.ss.usermodel.Row bigHeader = sheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell bigHeaderCell = bigHeader.createCell(0);
            bigHeaderCell.setCellValue("CWL Hardware");
            org.apache.poi.ss.usermodel.CellStyle bigHeaderStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font bigFont = workbook.createFont();
            bigFont.setFontName("Arial Black");
            bigFont.setFontHeightInPoints((short) 28);
            bigFont.setBold(true);
            bigHeaderStyle.setFont(bigFont);
            bigHeaderStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            bigHeaderCell.setCellStyle(bigHeaderStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, COLUMNS_XLSX_CSV.length - 1));
            // Visually obvious generated date
            org.apache.poi.ss.usermodel.Row genRow = sheet.createRow(1);
            org.apache.poi.ss.usermodel.Cell genCell = genRow.createCell(0);
            genCell.setCellValue("Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()));
            org.apache.poi.ss.usermodel.CellStyle genStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font genFont = workbook.createFont();
            genFont.setBold(true);
            genStyle.setFont(genFont);
            genStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            genCell.setCellStyle(genStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, COLUMNS_XLSX_CSV.length - 1));
            // Table header
            org.apache.poi.ss.usermodel.Row header = sheet.createRow(2);
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
            headerStyle.setWrapText(true);
            for (int i = 0; i < COLUMNS_XLSX_CSV.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
                cell.setCellValue(COLUMNS_XLSX_CSV[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowIdx = 3;
            for (Transaction txn : txns) {
                java.util.List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
                String products = items.stream().map(TransactionItem::getProductName).collect(java.util.stream.Collectors.joining("; "));
                String qtys = items.stream().map(i -> String.valueOf(i.getQuantity())).collect(java.util.stream.Collectors.joining("; "));
                String unitPrices = items.stream().map(i -> i.getUnitPrice().toPlainString()).collect(java.util.stream.Collectors.joining("; "));
                String totalPrices = items.stream().map(i -> i.getTotalPrice().toPlainString()).collect(java.util.stream.Collectors.joining("; "));
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                int colIdx = 0;
                row.createCell(colIdx++).setCellValue(txn.getTransactionId());
                row.createCell(colIdx++).setCellValue(txn.getTransactionDate() != null ? txn.getTransactionDate().toString() : "");
                row.createCell(colIdx++).setCellValue(txn.getTransactionType());
                row.createCell(colIdx++).setCellValue(products);
                row.createCell(colIdx++).setCellValue(qtys);
                row.createCell(colIdx++).setCellValue(unitPrices);
                row.createCell(colIdx++).setCellValue(totalPrices);
                row.createCell(colIdx++).setCellValue(txn.getGrandTotal() != null ? txn.getGrandTotal().doubleValue() : 0);
                row.createCell(colIdx++).setCellValue(txn.getBuyerName() != null && !txn.getBuyerName().isBlank() ? txn.getBuyerName() : txn.getSellerName());
                row.createCell(colIdx++).setCellValue(txn.getSellerName());
                row.createCell(colIdx++).setCellValue(txn.getDeliveryMethod());
                row.createCell(colIdx++).setCellValue(txn.getTransactionStatus() != null ? txn.getTransactionStatus() : "Ongoing");
            }
            int lastRow = sheet.getLastRowNum();
            org.apache.poi.ss.usermodel.CellStyle wrapCenter = workbook.createCellStyle();
            wrapCenter.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            wrapCenter.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
            wrapCenter.setWrapText(true);
            for (int r = 0; r <= lastRow; r++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(r);
                if (row != null) {
                    for (int c = 0; c < COLUMNS_XLSX_CSV.length; c++) {
                        org.apache.poi.ss.usermodel.Cell cell = row.getCell(c);
                        if (cell == null) {
                            cell = row.createCell(c);
                        }
                        cell.setCellStyle(wrapCenter);
                    }
                }
            }
            for (int i = 0; i < COLUMNS_XLSX_CSV.length; i++) {
                sheet.autoSizeColumn(i);
            }
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                workbook.write(fos);
            }
        }
        JOptionPane.showMessageDialog(this, "Exported to XLSX successfully.");
        logExport(filePath, ".XLSX");
    }

    private void exportCsv(String filePath, java.util.List<Transaction> txns) throws Exception {
        int confirm = JOptionPane.showConfirmDialog(this, "Export transactions to CSV?", "Confirm Export", JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION) return;
        try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
            // Visually obvious header and date
            writer.writeNext(new String[]{"CWL Hardware"});
            writer.writeNext(new String[]{"Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date())});
            writer.writeNext(COLUMNS_XLSX_CSV); // Column headers
            // Data rows
            for (Transaction txn : txns) {
                java.util.List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
                String products = items.stream().map(TransactionItem::getProductName).collect(java.util.stream.Collectors.joining("; "));
                String qtys = items.stream().map(i -> String.valueOf(i.getQuantity())).collect(java.util.stream.Collectors.joining("; "));
                String unitPrices = items.stream().map(i -> i.getUnitPrice().toPlainString()).collect(java.util.stream.Collectors.joining("; "));
                String totalPrices = items.stream().map(i -> i.getTotalPrice().toPlainString()).collect(java.util.stream.Collectors.joining("; "));
                String[] row = new String[COLUMNS_XLSX_CSV.length];
                int colIdx = 0;
                row[colIdx++] = String.valueOf(txn.getTransactionId());
                row[colIdx++] = txn.getTransactionDate() != null ? txn.getTransactionDate().toString() : "";
                row[colIdx++] = txn.getTransactionType();
                row[colIdx++] = products;
                row[colIdx++] = qtys;
                row[colIdx++] = unitPrices;
                row[colIdx++] = totalPrices;
                row[colIdx++] = txn.getGrandTotal() != null ? txn.getGrandTotal().toPlainString() : "0";
                row[colIdx++] = txn.getBuyerName() != null && !txn.getBuyerName().isBlank() ? txn.getBuyerName() : txn.getSellerName();
                row[colIdx++] = txn.getSellerName();
                row[colIdx++] = txn.getDeliveryMethod();
                row[colIdx++] = txn.getTransactionStatus() != null ? txn.getTransactionStatus() : "Ongoing";
                writer.writeNext(row);
            }
        }
        logExport(filePath, ".CSV");
    }

    private void exportPdf(String filePath, java.util.List<Transaction> txns) throws Exception {
        int confirm = JOptionPane.showConfirmDialog(this, "Export transactions to PDF?", "Confirm Export", JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION) return;
        Document document = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, new FileOutputStream(filePath));
        document.open();
        // Add Logo using flexible loading
        try {
            ImageIcon logoIcon = IconUtil.loadIcon("HardwareHub_Logo.png");
            if (logoIcon != null) {
                com.itextpdf.text.Image logo = com.itextpdf.text.Image.getInstance(logoIcon.getImage(), null);
                logo.scaleToFit(100, 100);
                logo.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
                document.add(logo);
                document.add(new com.itextpdf.text.Paragraph("\n"));
            }
        } catch (Exception e) {
            Logger.getLogger(ExportTransactionsDialog.class.getName()).log(Level.WARNING, "Could not add logo to PDF", e);
        }
        // Visually obvious title and date
        com.itextpdf.text.Font titleFont = new com.itextpdf.text.Font(
                com.itextpdf.text.Font.FontFamily.HELVETICA, 28, com.itextpdf.text.Font.BOLD, com.itextpdf.text.BaseColor.DARK_GRAY
        );
        com.itextpdf.text.Paragraph title = new com.itextpdf.text.Paragraph("CWL Hardware", titleFont);
        title.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        document.add(title);
        com.itextpdf.text.Paragraph gen = new com.itextpdf.text.Paragraph("Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()));
        gen.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        gen.getFont().setStyle(Font.BOLD);
        document.add(gen);
        document.add(com.itextpdf.text.Chunk.NEWLINE);
        // Main table (1 column that will contain nested tables)
        PdfPTable mainTable = new PdfPTable(1);
        mainTable.setWidthPercentage(100);

        for (Transaction txn : txns) {
            java.util.List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());

            // Transaction header table (11 columns)
            PdfPTable headerTable = new PdfPTable(11);
            headerTable.setWidthPercentage(100);

            // Add column headers (only once at the top)
            if (txns.indexOf(txn) == 0) {
                for (String col : COLUMNS_PDF) {
                    PdfPCell colHeader = new PdfPCell(new Phrase(col));
                    colHeader.setBackgroundColor(new BaseColor(220, 220, 220));
                    headerTable.addCell(colHeader);
                }
            }

            // Add transaction details (one row with merged cells where appropriate)
            PdfPCell idCell = new PdfPCell(new Phrase(String.valueOf(txn.getTransactionId())));
            idCell.setRowspan(items.size());
            headerTable.addCell(idCell);

            PdfPCell dateCell = new PdfPCell(new Phrase(txn.getTransactionDate() != null ? txn.getTransactionDate().toString() : ""));
            dateCell.setRowspan(items.size());
            headerTable.addCell(dateCell);

            PdfPCell typeCell = new PdfPCell(new Phrase(txn.getTransactionType()));
            typeCell.setRowspan(items.size());
            headerTable.addCell(typeCell);

            // Add product rows
            for (TransactionItem item : items) {
                // Product details (4 columns)
                headerTable.addCell(new Phrase(item.getProductName()));
                headerTable.addCell(new Phrase(String.valueOf(item.getQuantity())));
                headerTable.addCell(new Phrase(item.getUnitPrice().toPlainString()));
                headerTable.addCell(new Phrase(item.getTotalPrice().toPlainString()));

                // Transaction details (merged, only add once)
                if (items.indexOf(item) == 0) {
                    PdfPCell totalCell = new PdfPCell(new Phrase(txn.getGrandTotal() != null ? txn.getGrandTotal().toPlainString() : "0"));
                    totalCell.setRowspan(items.size());
                    headerTable.addCell(totalCell);

                    PdfPCell buyerCell = new PdfPCell(new Phrase(txn.getBuyerName() != null && !txn.getBuyerName().isBlank() ? txn.getBuyerName() : txn.getSellerName()));
                    buyerCell.setRowspan(items.size());
                    headerTable.addCell(buyerCell);

                    PdfPCell sellerCell = new PdfPCell(new Phrase(txn.getSellerName()));
                    sellerCell.setRowspan(items.size());
                    headerTable.addCell(sellerCell);

                    PdfPCell methodCell = new PdfPCell(new Phrase(txn.getDeliveryMethod()));
                    methodCell.setRowspan(items.size());
                    headerTable.addCell(methodCell);

                    // Transaction Status
                    PdfPCell statusCell = new PdfPCell(new Phrase(txn.getTransactionStatus() != null ? txn.getTransactionStatus() : "Ongoing"));
                    statusCell.setRowspan(items.size());
                    headerTable.addCell(statusCell);
                }
            }

            // Add the header table to main table
            PdfPCell containerCell = new PdfPCell(headerTable);
            containerCell.setBorder(PdfPCell.NO_BORDER);
            mainTable.addCell(containerCell);
        }
        logExport(filePath, ".PDF");
        document.add(mainTable);
        document.close();
    }

    private void exportFile(String format, boolean isCustom) {
        java.util.Date fromDate = dcFrom.getDate();
        java.util.Date toDate = dcTo.getDate();
        String type = (String) cbType.getSelectedItem();
        String buyerName = tfBuyerNameFilter.getText().trim();
        String status = (String) cbStatus.getSelectedItem();
        java.util.List<Transaction> txns;
        if (isCustom) {
            txns = loadFilteredTransactions(fromDate, toDate, type, buyerName, status);
        } else if (rbCurrent.isSelected()) {
            txns = new java.util.ArrayList<>(transactionsFromPanel);
        } else {
            txns = TransactionDAO.getAllTransactions();
        }
        if (txns.isEmpty()) {
            JOptionPane.showMessageDialog(this, "No transactions match the selected filters.", "No Data", JOptionPane.WARNING_MESSAGE);
            return;
        }
        // --- Build filter summary for filename ---
        StringBuilder filterSummary = new StringBuilder();
        if (isCustom) {
            if (fromDate != null) {
                filterSummary.append("_from-").append(new java.text.SimpleDateFormat("yyyyMMdd").format(fromDate));
            }
            if (toDate != null) {
                filterSummary.append("_to-").append(new java.text.SimpleDateFormat("yyyyMMdd").format(toDate));
            }
            if (!"All".equals(type)) {
                filterSummary.append("_type-").append(type);
            }
            if (!buyerName.isEmpty()) {
                filterSummary.append("_buyer-").append(buyerName.replaceAll("\\s+", "_"));
            }
            if (!"All".equals(status)) {
                filterSummary.append("_status-").append(status);
            }
            if (!selectedCategoryIds.isEmpty()) {
                filterSummary.append("_cat-").append(selectedCategoryIds.size());
            }
            if (!selectedProductIds.isEmpty()) {
                filterSummary.append("_prod-").append(selectedProductIds.size());
            }
        }
        String selectedFormat = (String) cbFormat.getSelectedItem();
        String extension = "xlsx";
        if (selectedFormat.startsWith("CSV")) {
            extension = "csv";
        } else if (selectedFormat.startsWith("PDF")) {
            extension = "pdf";
        }
        String defaultFileName = "transactions_export" + filterSummary + "." + extension;
        tfFile.setText(new java.io.File(fileChooser.getCurrentDirectory(), defaultFileName).getAbsolutePath());
        try {
            if ("XLSX".equalsIgnoreCase(format)) {
                exportXlsx(tfFile.getText(), txns);
            } else if ("CSV".equalsIgnoreCase(format)) {
                exportCsv(tfFile.getText(), txns);
            } else if ("PDF".equalsIgnoreCase(format)) {
                exportPdf(tfFile.getText(), txns);
            }
            JOptionPane.showMessageDialog(this, "Export successful!\nFile: " + tfFile.getText());
            dispose();
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Export failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void logExport(String filePath, String format) {
        hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
        int sellerId = user != null ? user.getSellerId() : 0;
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String details = "Exported Transactions to: " + filePath + " (" + format + ")";
        hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "StockMovementsPanel", "Export", details));
    }
}
