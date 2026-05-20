package hardwarehub_main.gui.inventory;

import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.Product;
import hardwarehub_main.dao.SupplierDAO;
import hardwarehub_main.model.Supplier;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.opencsv.*;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import hardwarehub_main.util.IconUtil;
import javax.imageio.ImageIO;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ExportReportsDialog extends JDialog {

    private enum ExportType {
        PRODUCTS, SUPPLIERS
    }
    private JButton btnExportXlsx, btnExportCsv, btnExportPdf, btnCancel;
    private JComboBox<String> cbFormat;
    private JFileChooser fileChooser;
    private JRadioButton rbAll, rbByCategory, rbSuppliers, rbBySupplier;
    private ButtonGroup exportGroup;
    private JPanel supplierPanel, categoryPanel;
    private JScrollPane supplierScrollPane, categoryScrollPane;
    private java.util.List<JCheckBox> supplierCheckBoxes;
    private JCheckBox cbSelectAllSuppliers, cbSelectAllCategories;
    private java.util.List<JCheckBox> categoryCheckBoxes;
    private java.util.Map<Integer, JCheckBox> parentCategoryCheckBoxMap;
    private java.util.Map<Integer, java.util.List<JCheckBox>> parentToChildCheckBoxMap;
    private ExportType selectedType = ExportType.PRODUCTS;
    private java.util.List<String> selectedCategories = null;
    private JCheckBox cbLowStock, cbNoStock, cbAvailableOnly, cbUnavailableOnly, cbFastMoving, cbMultiSupplier;
    private JComboBox<String> cbSupplierFilter;

    public ExportReportsDialog(Window owner) {
        super(owner, "Export Inventory Report", ModalityType.APPLICATION_MODAL);
        setLayout(new BorderLayout(10, 10));
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setSize(750, 600);
        setLocationRelativeTo(owner);
        setIconImage(hardwarehub_main.util.IconUtil.loadIcon("HardwareHub_Icon.png").getImage());

        JPanel mainPanel = new JPanel();
        mainPanel.setLayout(new BoxLayout(mainPanel, BoxLayout.Y_AXIS));

        // Filter panel
        JPanel filterPanel = new JPanel();
        filterPanel.setLayout(new FlowLayout(FlowLayout.LEFT));
        filterPanel.setBorder(BorderFactory.createTitledBorder("Filters"));
        cbLowStock = new JCheckBox("Low Stock");
        filterPanel.add(cbLowStock);
        cbNoStock = new JCheckBox("No Stock");
        filterPanel.add(cbNoStock);
        cbAvailableOnly = new JCheckBox("Available Only");
        filterPanel.add(cbAvailableOnly);
        cbUnavailableOnly = new JCheckBox("Unavailable Only");
        filterPanel.add(cbUnavailableOnly);
        cbFastMoving = new JCheckBox("Fast-Moving");
        filterPanel.add(cbFastMoving);
        cbMultiSupplier = new JCheckBox("Multi-Supplier");
        filterPanel.add(cbMultiSupplier);
        mainPanel.add(filterPanel);
        mainPanel.add(Box.createVerticalStrut(10));

        // Export type panel
        JPanel typePanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        typePanel.setBorder(BorderFactory.createTitledBorder("Export Type"));
        rbAll = new JRadioButton("All Products");
        rbByCategory = new JRadioButton("By Category");
        rbSuppliers = new JRadioButton("Suppliers Only");
        rbBySupplier = new JRadioButton("By Supplier");
        exportGroup = new ButtonGroup();
        exportGroup.add(rbAll);
        exportGroup.add(rbByCategory);
        exportGroup.add(rbSuppliers);
        exportGroup.add(rbBySupplier);
        rbAll.setSelected(true);
        typePanel.add(rbAll);
        typePanel.add(rbByCategory);
        typePanel.add(rbSuppliers);
        typePanel.add(rbBySupplier);
        mainPanel.add(typePanel);
        mainPanel.add(Box.createVerticalStrut(10));

        // Supplier panel (scrollable, with Select All)
        supplierPanel = new JPanel();
        supplierPanel.setLayout(new BoxLayout(supplierPanel, BoxLayout.Y_AXIS));
        cbSelectAllSuppliers = new JCheckBox("Select All Suppliers");
        supplierPanel.add(cbSelectAllSuppliers);
        supplierCheckBoxes = new java.util.ArrayList<>();
        for (hardwarehub_main.model.Supplier s : hardwarehub_main.dao.SupplierDAO.getAllSuppliers()) {
            JCheckBox cb = new JCheckBox(s.getSupplierName());
            supplierCheckBoxes.add(cb);
            supplierPanel.add(cb);
        }
        supplierScrollPane = new JScrollPane(supplierPanel);
        supplierScrollPane.setPreferredSize(new Dimension(300, 200));

        cbSelectAllSuppliers.addActionListener(e -> {
            boolean selected = cbSelectAllSuppliers.isSelected();
            for (JCheckBox cb : supplierCheckBoxes) {
                cb.setSelected(selected);
            }
        });

        // Category panel (scrollable, with Select All, parent/child logic)
        categoryPanel = new JPanel();
        categoryPanel.setLayout(new BoxLayout(categoryPanel, BoxLayout.Y_AXIS));
        cbSelectAllCategories = new JCheckBox("Select All Categories");
        categoryPanel.add(cbSelectAllCategories);
        categoryCheckBoxes = new java.util.ArrayList<>();
        parentCategoryCheckBoxMap = new java.util.HashMap<>();
        parentToChildCheckBoxMap = new java.util.HashMap<>();
        java.util.List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
        // Build parent/child map
        java.util.Map<Integer, java.util.List<hardwarehub_main.model.Category>> parentToChildren = new java.util.HashMap<>();
        for (hardwarehub_main.model.Category c : categories) {
            parentToChildren.computeIfAbsent(c.getParentCategoryId(), k -> new java.util.ArrayList<>()).add(c);
        }
        // Recursive function to add checkboxes
        java.util.function.BiConsumer<java.util.List<hardwarehub_main.model.Category>, Integer> addCategoryCheckboxes = new java.util.function.BiConsumer<>() {
            @Override
            public void accept(java.util.List<hardwarehub_main.model.Category> cats, Integer level) {
                for (hardwarehub_main.model.Category cat : cats) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < level; i++) {
                        sb.append("    ");
                    }
                    sb.append(cat.getCategory());
                    JCheckBox cb = new JCheckBox(sb.toString());
                    categoryCheckBoxes.add(cb);
                    categoryPanel.add(cb);
                    if (parentToChildren.containsKey(cat.getCategoryId())) {
                        parentCategoryCheckBoxMap.put(cat.getCategoryId(), cb);
                        java.util.List<JCheckBox> children = new java.util.ArrayList<>();
                        parentToChildCheckBoxMap.put(cat.getCategoryId(), children);
                        for (hardwarehub_main.model.Category child : parentToChildren.get(cat.getCategoryId())) {
                            JCheckBox childCb = new JCheckBox("    " + child.getCategory());
                            categoryCheckBoxes.add(childCb);
                            categoryPanel.add(childCb);
                            children.add(childCb);
                        }
                        // Parent controls children
                        cb.addActionListener(e -> {
                            boolean selected = cb.isSelected();
                            for (JCheckBox childCb : children) {
                                childCb.setSelected(selected);
                            }
                        });
                        // Children can be unchecked independently
                    }
                }
            }
        };
        java.util.List<hardwarehub_main.model.Category> roots = parentToChildren.get(null);
        if (roots != null) {
            addCategoryCheckboxes.accept(roots, 0);
        }
        categoryScrollPane = new JScrollPane(categoryPanel);
        categoryScrollPane.setPreferredSize(new Dimension(300, 200));

        cbSelectAllCategories.addActionListener(e -> {
            boolean selected = cbSelectAllCategories.isSelected();
            for (JCheckBox cb : categoryCheckBoxes) {
                cb.setSelected(selected);
            }
        });

        // Export buttons
        JPanel exportButtonsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        exportButtonsPanel.setBorder(BorderFactory.createTitledBorder("Export Format"));
        btnExportXlsx = new JButton("Export to XLSX");
        btnExportCsv = new JButton("Export to CSV");
        btnExportPdf = new JButton("Export to PDF");
        btnCancel = new JButton("Cancel");
        exportButtonsPanel.add(btnExportXlsx);
        exportButtonsPanel.add(btnExportCsv);
        exportButtonsPanel.add(btnExportPdf);
        exportButtonsPanel.add(btnCancel);

        // 1. Create exportOptionsPanel
        JPanel exportOptionsPanel = new JPanel();
        exportOptionsPanel.setLayout(new BoxLayout(exportOptionsPanel, BoxLayout.Y_AXIS));
        exportOptionsPanel.setBorder(BorderFactory.createTitledBorder("Export Options"));
        // Add label and scrollpane for categories
        exportOptionsPanel.add(new JLabel("Categories"));
        exportOptionsPanel.add(categoryScrollPane);
        exportOptionsPanel.add(new JSeparator(JSeparator.HORIZONTAL));
        // Add label and scrollpane for suppliers
        exportOptionsPanel.add(new JLabel("Suppliers"));
        exportOptionsPanel.add(supplierScrollPane);
        exportOptionsPanel.add(Box.createVerticalStrut(10));
        exportOptionsPanel.add(exportButtonsPanel);
        mainPanel.add(exportOptionsPanel);

        // 2. Always show both scrollpanes, but enable/disable them and their checkboxes based on export type
        Runnable setExportOptionState = () -> {
            boolean all = rbAll.isSelected();
            boolean byCat = rbByCategory.isSelected();
            boolean bySup = rbSuppliers.isSelected() || rbBySupplier.isSelected();
            // Category scrollpane
            for (Component c : categoryPanel.getComponents()) {
                c.setEnabled(byCat);
            }
            // Supplier scrollpane
            for (Component c : supplierPanel.getComponents()) {
                c.setEnabled(bySup);
            }
            // If all, disable both
            if (all) {
                for (Component c : categoryPanel.getComponents()) {
                    c.setEnabled(false);
                }
                for (Component c : supplierPanel.getComponents()) {
                    c.setEnabled(false);
                }
            }
        };
        rbByCategory.addActionListener(e -> {
            setExportOptionState.run();
        });
        rbSuppliers.addActionListener(e -> {
            setExportOptionState.run();
        });
        rbBySupplier.addActionListener(e -> {
            setExportOptionState.run();
        });
        rbAll.addActionListener(e -> {
            setExportOptionState.run();
        });
        // 3. Fix 'Select All' logic
        cbSelectAllCategories.addActionListener(e -> {
            boolean selected = cbSelectAllCategories.isSelected();
            for (JCheckBox cb : categoryCheckBoxes) {
                cb.setSelected(selected);
            }
        });
        cbSelectAllSuppliers.addActionListener(e -> {
            boolean selected = cbSelectAllSuppliers.isSelected();
            for (JCheckBox cb : supplierCheckBoxes) {
                cb.setSelected(selected);
            }
        });
        // 4. Call setExportOptionState() after UI setup to initialize state
        setExportOptionState.run();

        // Set up file chooser
        String userHome = System.getProperty("user.home");
        Path exportDir = Paths.get(userHome, "Documents", "HardwareHub", "Exports", "Inventory");
        if (!Files.exists(exportDir)) try {
            Files.createDirectories(exportDir);
        } catch (Exception ex) {
        }
        fileChooser = new JFileChooser(exportDir.toFile());
        fileChooser.resetChoosableFileFilters();
        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("Excel Files (*.xlsx)", ".xlsx"));
        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("CSV Files (*.csv)", ".csv"));
        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("PDF Files (*.pdf)", ".pdf"));
        fileChooser.setAcceptAllFileFilterUsed(true);
        String defaultFileName = "inventory_export_" + new SimpleDateFormat("yyyyMMdd").format(new Date()) + ".";
        fileChooser.setSelectedFile(new File(fileChooser.getCurrentDirectory(), defaultFileName));

        btnExportXlsx.addActionListener(e -> exportFile("XLSX"));
        btnExportCsv.addActionListener(e -> exportFile("CSV"));
        btnExportPdf.addActionListener(e -> exportFile("PDF"));
        btnCancel.addActionListener(e -> dispose());

        add(mainPanel, BorderLayout.CENTER);
    }

    private ExportType getSelectedExportType() {
        if (rbSuppliers.isSelected()) {
            return ExportType.SUPPLIERS;
        }
        return ExportType.PRODUCTS;
    }

    private java.util.List<String> getSelectedCategories() {
        if (!rbByCategory.isSelected()) {
            return null;
        }
        java.util.List<String> selected = new java.util.ArrayList<>();
        for (JCheckBox cb : categoryCheckBoxes) {
            if (cb.isSelected()) {
                selected.add(cb.getText());
            }
        }
        return selected.isEmpty() ? null : selected;
    }

    private String buildExportFilename(String format) {
        StringBuilder sb = new StringBuilder();
        sb.append("inventory_export_");
        sb.append(new java.text.SimpleDateFormat("yyyyMMdd").format(new java.util.Date()));
        // Add filter keywords
        if (cbAvailableOnly != null && cbAvailableOnly.isSelected()) {
            sb.append("_availableonly");
        }
        if (cbUnavailableOnly != null && cbUnavailableOnly.isSelected()) {
            sb.append("_unavailableonly");
        }
        if (cbLowStock != null && cbLowStock.isSelected()) {
            sb.append("_lowstock");
        }
        if (cbNoStock != null && cbNoStock.isSelected()) {
            sb.append("_nostock");
        }
        if (cbFastMoving != null && cbFastMoving.isSelected()) {
            sb.append("_fastmoving");
        }
        if (cbMultiSupplier != null && cbMultiSupplier.isSelected()) {
            sb.append("_multisupplier");
        }
        // Add selected categories
        java.util.Set<String> cats = getCheckedCategories();
        if (cats != null && !cats.isEmpty()) {
            sb.append("_cat").append(cats.size());
        }
        // Add selected suppliers
        java.util.Set<String> sups = getCheckedSuppliers();
        if (sups != null && !sups.isEmpty()) {
            sb.append("_sup").append(sups.size());
        }
        sb.append(".").append(format.toLowerCase());
        return sb.toString();
    }

    private boolean showFileChooserWithDefault(String format) {
        String userHome = System.getProperty("user.home");
        java.nio.file.Path exportDir = java.nio.file.Paths.get(userHome, "Documents", "HardwareHub", "Exports", "Inventory");
        if (!java.nio.file.Files.exists(exportDir)) try {
            java.nio.file.Files.createDirectories(exportDir);
        } catch (Exception ex) {
        }
        fileChooser.setCurrentDirectory(exportDir.toFile());
        String defaultFileName = buildExportFilename(format);
        fileChooser.setSelectedFile(new java.io.File(exportDir.toFile(), defaultFileName));
        int result = fileChooser.showSaveDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            String chosen = fileChooser.getSelectedFile().getAbsolutePath();
            if (!chosen.toLowerCase().endsWith("." + format.toLowerCase())) {
                chosen += "." + format.toLowerCase();
                fileChooser.setSelectedFile(new java.io.File(chosen));
            }
            return true;
        }
        return false;
    }

    private void exportFile(String format) {
        if (!showFileChooserWithDefault(format)) {
            return;
        }
        ExportType type = getSelectedExportType();
        java.util.List<String> categories = getSelectedCategories();
        String filePath = fileChooser.getSelectedFile().getAbsolutePath();
        if (filePath == null || filePath.trim().isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please select a file to export.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        try {
            if (format.equals("XLSX")) {
                exportXlsx(type, categories, filePath);
            } else if (format.equals("CSV")) {
                exportCsv(type, categories, filePath);
            } else if (format.equals("PDF")) {
                exportPdf(type, categories, filePath);
            }
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Export failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private java.util.Set<String> getCheckedCategories() {
        java.util.Set<String> selected = new java.util.HashSet<>();
        for (JCheckBox cb : categoryCheckBoxes) {
            if (cb.isSelected()) {
                selected.add(cb.getText().trim());
            }
        }
        return selected.isEmpty() ? null : selected;
    }

    private java.util.Set<String> getCheckedSuppliers() {
        java.util.Set<String> selected = new java.util.HashSet<>();
        for (JCheckBox cb : supplierCheckBoxes) {
            if (cb.isSelected()) {
                selected.add(cb.getText().trim());
            }
        }
        return selected.isEmpty() ? null : selected;
    }

    private java.util.List<Product> getFilteredProductsForExport() {
        String searchText = ""; // Optionally add a search field to the export dialog
        String supplierFilter = (cbSupplierFilter != null && cbSupplierFilter.getSelectedIndex() > 0) ? (String) cbSupplierFilter.getSelectedItem() : null;
        boolean lowStock = cbLowStock != null && cbLowStock.isSelected();
        boolean noStock = cbNoStock != null && cbNoStock.isSelected();
        boolean availableOnly = cbAvailableOnly != null && cbAvailableOnly.isSelected();
        boolean unavailableOnly = cbUnavailableOnly != null && cbUnavailableOnly.isSelected();
        boolean fastMoving = cbFastMoving != null && cbFastMoving.isSelected();
        boolean multiSupplier = cbMultiSupplier != null && cbMultiSupplier.isSelected();
        java.util.Set<String> selectedCategories = getCheckedCategories();
        java.util.Set<String> selectedSuppliers = getCheckedSuppliers();
        return hardwarehub_main.util.InventoryFilterUtil.filterProducts(
                hardwarehub_main.dao.ProductDAO.getAllProducts(),
                searchText,
                supplierFilter,
                lowStock,
                noStock,
                availableOnly,
                unavailableOnly,
                fastMoving,
                multiSupplier,
                selectedCategories,
                selectedSuppliers
        );
    }

    private java.util.List<Supplier> getFilteredSuppliersForExport() {
        java.util.Set<String> selectedSuppliers = getCheckedSuppliers();
        java.util.List<Supplier> all = hardwarehub_main.dao.SupplierDAO.getAllSuppliers();
        if (selectedSuppliers == null || selectedSuppliers.isEmpty()) {
            return all;
        }
        java.util.List<Supplier> filtered = new java.util.ArrayList<>();
        for (Supplier s : all) {
            if (selectedSuppliers.contains(s.getSupplierName())) {
                filtered.add(s);
            }
        }
        return filtered;
    }

    private void exportXlsx(ExportType type, java.util.List<String> categories, String filePath) throws Exception {
        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Inventory");
            String[] columns;
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
            if (type == ExportType.SUPPLIERS) {
                columns = new String[]{"Supplier ID", "Name", "Contact Name", "Contact Number", "Email", "Address", "Available"};
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, columns.length - 1));
            } else {
                columns = new String[]{"Product ID", "Name", "Category", "Supplier", "Price", "Quantity", "Min Threshold", "Available"};
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, columns.length - 1));
            }
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
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, columns.length - 1));
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
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowStart = 3;
            if (type == ExportType.SUPPLIERS) {
                java.util.List<Supplier> suppliers = getFilteredSuppliersForExport();
                for (int i = 0; i < suppliers.size(); i++) {
                    Supplier s = suppliers.get(i);
                    org.apache.poi.ss.usermodel.Row row = sheet.createRow(i + rowStart);
                    row.createCell(0).setCellValue(s.getSupplierId());
                    row.createCell(1).setCellValue(s.getSupplierName());
                    row.createCell(2).setCellValue(s.getContactName());
                    row.createCell(3).setCellValue(s.getContactNumber());
                    row.createCell(4).setCellValue(s.getEmail());
                    row.createCell(5).setCellValue(s.getAddress());
                    row.createCell(6).setCellValue(s.isAvailable() ? "Yes" : "No");
                }
            } else {
                java.util.List<Product> products = getFilteredProductsForExport();
                for (int i = 0; i < products.size(); i++) {
                    Product p = products.get(i);
                    org.apache.poi.ss.usermodel.Row row = sheet.createRow(i + rowStart);
                    row.createCell(0).setCellValue(p.getProductId());
                    row.createCell(1).setCellValue(p.getProductName());
                    hardwarehub_main.model.Category child = hardwarehub_main.dao.CategoryDAO.getCategoryById(p.getCategoryId());
                    String categoryDisplay;
                    if (child != null && child.getParentCategoryId() != null) {
                        hardwarehub_main.model.Category parent = hardwarehub_main.dao.CategoryDAO.getCategoryById(child.getParentCategoryId());
                        if (parent != null) {
                            categoryDisplay = parent.getCategory() + " (" + child.getCategory() + ")";
                        } else {
                            categoryDisplay = child.getCategory();
                        }
                    } else if (child != null) {
                        categoryDisplay = child.getCategory();
                    } else {
                        categoryDisplay = p.getCategory();
                    }
                    row.createCell(2).setCellValue(categoryDisplay);
                    row.createCell(3).setCellValue(p.getSupplierName());
                    row.createCell(4).setCellValue(p.getUnitPrice().doubleValue());
                    row.createCell(5).setCellValue(p.getQuantity());
                    row.createCell(6).setCellValue(p.getMinThreshold());
                    row.createCell(7).setCellValue(p.isAvailable() ? "Yes" : "No");
                }
            }
            int lastRow = sheet.getLastRowNum();
            org.apache.poi.ss.usermodel.CellStyle wrapCenter = workbook.createCellStyle();
            wrapCenter.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            wrapCenter.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
            wrapCenter.setWrapText(true);
            for (int r = 0; r <= lastRow; r++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(r);
                if (row != null) {
                    for (int c = 0; c < columns.length; c++) {
                        org.apache.poi.ss.usermodel.Cell cell = row.getCell(c);
                        if (cell == null) {
                            cell = row.createCell(c);
                        }
                        cell.setCellStyle(wrapCenter);
                    }
                }
            }
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                workbook.write(fos);
            }
            JOptionPane.showMessageDialog(this, "Exported to XLSX successfully.");
            logExport(filePath, ".XLSX");
        }
    }

    private void exportCsv(ExportType type, java.util.List<String> categories, String filePath) throws Exception {
        try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
            String[] columns;
            // Visually obvious header and date
            writer.writeNext(new String[]{"CWL Hardware"});
            writer.writeNext(new String[]{"Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date())});
            if (type == ExportType.SUPPLIERS) {
                columns = new String[]{"Supplier ID", "Name", "Contact Name", "Contact Number", "Email", "Address", "Available"};
                writer.writeNext(columns);
                java.util.List<Supplier> suppliers = getFilteredSuppliersForExport();
                for (Supplier s : suppliers) {
                    writer.writeNext(new String[]{
                        String.valueOf(s.getSupplierId()),
                        s.getSupplierName(),
                        s.getContactName(),
                        s.getContactNumber(),
                        s.getEmail(),
                        s.getAddress(),
                        s.isAvailable() ? "Yes" : "No"
                    });
                }
            } else {
                columns = new String[]{"Product ID", "Name", "Category", "Supplier", "Price", "Quantity", "Min Threshold", "Available"};
                writer.writeNext(columns);
                java.util.List<Product> products = getFilteredProductsForExport();
                for (Product p : products) {
                    hardwarehub_main.model.Category child = hardwarehub_main.dao.CategoryDAO.getCategoryById(p.getCategoryId());
                    String categoryDisplay;
                    if (child != null && child.getParentCategoryId() != null) {
                        hardwarehub_main.model.Category parent = hardwarehub_main.dao.CategoryDAO.getCategoryById(child.getParentCategoryId());
                        if (parent != null) {
                            categoryDisplay = parent.getCategory() + " (" + child.getCategory() + ")";
                        } else {
                            categoryDisplay = child.getCategory();
                        }
                    } else if (child != null) {
                        categoryDisplay = child.getCategory();
                    } else {
                        categoryDisplay = p.getCategory();
                    }
                    writer.writeNext(new String[]{
                        String.valueOf(p.getProductId()),
                        p.getProductName(),
                        categoryDisplay,
                        p.getSupplierName(),
                        p.getUnitPrice().toPlainString(),
                        String.valueOf(p.getQuantity()),
                        String.valueOf(p.getMinThreshold()),
                        p.isAvailable() ? "Yes" : "No"
                    });
                }
            }
            JOptionPane.showMessageDialog(this, "Exported to CSV successfully.");
            logExport(filePath, ".CSV");
        }
    }

    private void exportPdf(ExportType type, java.util.List<String> categories, String filePath) throws Exception {
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        com.itextpdf.text.pdf.PdfWriter.getInstance(document, new FileOutputStream(filePath));
        document.open();
        ImageIcon logoIcon = hardwarehub_main.util.IconUtil.loadIcon("HardwareHub_Logo.png");
        if (logoIcon != null) {
            com.itextpdf.text.Image logo = com.itextpdf.text.Image.getInstance(logoIcon.getImage(), null);
            logo.scaleToFit(120, 120);
            logo.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
            document.add(logo);
        }
        com.itextpdf.text.Paragraph gen = new com.itextpdf.text.Paragraph("Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()));
        gen.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        gen.getFont().setStyle(com.itextpdf.text.Font.BOLD);
        document.add(gen);
        document.add(com.itextpdf.text.Chunk.NEWLINE);
        com.itextpdf.text.Font reportTitleFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 22, com.itextpdf.text.Font.BOLD, com.itextpdf.text.BaseColor.BLUE);
        com.itextpdf.text.Paragraph reportTitle = new com.itextpdf.text.Paragraph("Inventory Report", reportTitleFont);
        reportTitle.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        reportTitle.setSpacingAfter(20);
        document.add(reportTitle);
        String[] columns;
        if (type == ExportType.SUPPLIERS) {
            columns = new String[]{"Supplier ID", "Name", "Contact Name", "Contact Number", "Email", "Address", "Available"};
            com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(columns.length);
            table.setWidthPercentage(100);
            com.itextpdf.text.Font headerFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 12, com.itextpdf.text.Font.BOLD, com.itextpdf.text.BaseColor.WHITE);
            com.itextpdf.text.pdf.PdfPCell headerCell;
            for (String col : columns) {
                headerCell = new com.itextpdf.text.pdf.PdfPCell(new com.itextpdf.text.Phrase(col, headerFont));
                headerCell.setBackgroundColor(com.itextpdf.text.BaseColor.DARK_GRAY);
                headerCell.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
                table.addCell(headerCell);
            }
            java.util.List<Supplier> suppliers = getFilteredSuppliersForExport();
            for (Supplier s : suppliers) {
                table.addCell(String.valueOf(s.getSupplierId()));
                table.addCell(s.getSupplierName());
                table.addCell(s.getContactName());
                table.addCell(s.getContactNumber());
                table.addCell(s.getEmail());
                table.addCell(s.getAddress());
                table.addCell(s.isAvailable() ? "Yes" : "No");
            }
            document.add(table);
            document.close();
            JOptionPane.showMessageDialog(this, "Exported to PDF successfully.");
            logExport(filePath, ".PDF");
            return;
        }
        columns = new String[]{"Product ID", "Name", "Category", "Supplier", "Price", "Quantity", "Min Threshold", "Available"};
        com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(columns.length);
        table.setWidthPercentage(100);
        com.itextpdf.text.Font headerFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 12, com.itextpdf.text.Font.BOLD, com.itextpdf.text.BaseColor.WHITE);
        com.itextpdf.text.pdf.PdfPCell headerCell;
        for (String col : columns) {
            headerCell = new com.itextpdf.text.pdf.PdfPCell(new com.itextpdf.text.Phrase(col, headerFont));
            headerCell.setBackgroundColor(com.itextpdf.text.BaseColor.DARK_GRAY);
            headerCell.setHorizontalAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
            table.addCell(headerCell);
        }
        java.util.List<Product> products = getFilteredProductsForExport();
        for (Product p : products) {
            hardwarehub_main.model.Category child = hardwarehub_main.dao.CategoryDAO.getCategoryById(p.getCategoryId());
            String categoryDisplay;
            if (child != null && child.getParentCategoryId() != null) {
                hardwarehub_main.model.Category parent = hardwarehub_main.dao.CategoryDAO.getCategoryById(child.getParentCategoryId());
                if (parent != null) {
                    categoryDisplay = parent.getCategory() + " (" + child.getCategory() + ")";
                } else {
                    categoryDisplay = child.getCategory();
                }
            } else if (child != null) {
                categoryDisplay = child.getCategory();
            } else {
                categoryDisplay = p.getCategory();
            }
            table.addCell(String.valueOf(p.getProductId()));
            table.addCell(p.getProductName());
            table.addCell(categoryDisplay);
            table.addCell(p.getSupplierName());
            table.addCell(p.getUnitPrice().toPlainString());
            table.addCell(String.valueOf(p.getQuantity()));
            table.addCell(String.valueOf(p.getMinThreshold()));
            table.addCell(p.isAvailable() ? "Yes" : "No");
        }
        document.add(table);
        document.close();
        JOptionPane.showMessageDialog(this, "Exported to PDF successfully.");
        logExport(filePath, ".PDF");
    }

    private void logExport(String filePath, String format) {
        hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
        int sellerId = user != null ? user.getSellerId() : 0;
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String details = "Exported inventory to: " + filePath + " (" + format + ")";
        hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "InventoryPanel", "Export", details));
    }
}
