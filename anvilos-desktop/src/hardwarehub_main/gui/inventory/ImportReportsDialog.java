package hardwarehub_main.gui.inventory;

import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.Product;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.opencsv.*;

import javax.swing.*;
import java.awt.*;
import java.io.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.logging.Level;
import java.util.logging.Logger;
import hardwarehub_main.util.IconUtil;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ImportReportsDialog extends JDialog {
    public ImportReportsDialog(Window owner) {
        super(owner, "Import Inventory Data", ModalityType.APPLICATION_MODAL);
        setLayout(new BorderLayout());
        setSize(400, 200);
        setLocationRelativeTo(owner);

        JPanel panel = new JPanel(new GridLayout(0, 1, 10, 10));
        JButton btnProductXlsx = new JButton("Import Product XLSX");
        JButton btnProductCsv = new JButton("Import Product CSV");
        JButton btnSupplierXlsx = new JButton("Import Supplier XLSX");
        JButton btnSupplierCsv = new JButton("Import Supplier CSV");
        panel.add(btnProductXlsx);
        panel.add(btnProductCsv);
        panel.add(btnSupplierXlsx);
        panel.add(btnSupplierCsv);
        add(panel, BorderLayout.CENTER);

        btnProductXlsx.addActionListener(e -> importProductsXlsx());
        btnProductCsv.addActionListener(e -> importProductsCsv());
        btnSupplierXlsx.addActionListener(e -> importSuppliersXlsx());
        btnSupplierCsv.addActionListener(e -> importSuppliersCsv());

        ImageIcon logo = IconUtil.loadIcon("HardwareHub_Icon.png");
        setIconImage(logo.getImage());
    }

    private enum ImportMode { OVERWRITE, APPEND }
    public enum ImportType { PRODUCTS, SUPPLIERS }

    private ImportMode promptImportMode() {
        String[] options = {"Overwrite (replace all)", "Append (add to existing)"};
        int choice = JOptionPane.showOptionDialog(this,
                "How do you want to import the data?",
                "Import Mode",
                JOptionPane.DEFAULT_OPTION,
                JOptionPane.QUESTION_MESSAGE,
                null,
                options,
                options[0]);
        if (choice == 0) return ImportMode.OVERWRITE;
        if (choice == 1) return ImportMode.APPEND;
        return null;
    }

    private ImportType promptImportType() {
        String[] options = {"Import Products", "Import Suppliers"};
        int choice = JOptionPane.showOptionDialog(this, "What do you want to import?", "Import Options", JOptionPane.DEFAULT_OPTION, JOptionPane.QUESTION_MESSAGE, null, options, options[0]);
        return (choice == 0) ? ImportType.PRODUCTS : ImportType.SUPPLIERS;
    }

    private void importProductsXlsx() {
        ImportMode mode = promptImportMode();
        if (mode == null) return;
        String userHome = System.getProperty("user.home");
        JFileChooser chooser = new JFileChooser(new File(userHome, "Documents"));
        chooser.setDialogTitle("Open XLSX file for Products");
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            File file = chooser.getSelectedFile();
            try (FileInputStream fis = new FileInputStream(file); Workbook workbook = new XSSFWorkbook(fis)) {
                Sheet sheet = workbook.getSheetAt(0);
                Iterator<Row> rowIterator = sheet.iterator();
                if (rowIterator.hasNext()) rowIterator.next(); // Skip header
                List<Product> imported = new ArrayList<>();
                List<String> skipped = new ArrayList<>();
                List<Integer> existingIds = new ArrayList<>();
                if (mode == ImportMode.OVERWRITE) {
                    List<Product> all = ProductDAO.getAllProducts();
                    for (Product p : all) ProductDAO.deleteProduct(p.getProductId());
                }
                if (mode == ImportMode.APPEND) {
                    for (Product p : ProductDAO.getAllProducts()) existingIds.add(p.getProductId());
                }
                while (rowIterator.hasNext()) {
                    Row row = rowIterator.next();
                    Product p = parseProductRow(row);
                    if (!validateProduct(p)) {
                        skipped.add("Row " + row.getRowNum() + 1);
                        continue;
                    }
                    if (mode == ImportMode.APPEND && existingIds.contains(p.getProductId())) {
                        skipped.add("Row " + row.getRowNum() + 1);
                        continue;
                    }
                    if (p != null && ProductDAO.insertProduct(p)) imported.add(p);
                    else skipped.add("Row " + row.getRowNum() + 1);
                }
                String msg = "Imported " + imported.size() + " products from XLSX." + (skipped.isEmpty() ? "" : "\nSkipped rows: " + skipped);
                JOptionPane.showMessageDialog(this, msg);
                // --- Audit log ---
                hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                int sellerId = user != null ? user.getSellerId() : 0;
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                String details = "Imported products from: " + file.getAbsolutePath() + " (XLSX)";
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "InventoryPanel", "Import", details));
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Import failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void importProductsCsv() {
        ImportMode mode = promptImportMode();
        if (mode == null) return;
        String userHome = System.getProperty("user.home");
        JFileChooser chooser = new JFileChooser(new File(userHome, "Documents"));
        chooser.setDialogTitle("Open CSV file for Products");
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            File file = chooser.getSelectedFile();
            try (CSVReader reader = new CSVReader(new FileReader(file))) {
                String[] nextLine;
                List<Product> imported = new ArrayList<>();
                List<String> skipped = new ArrayList<>();
                List<Integer> existingIds = new ArrayList<>();
                if (mode == ImportMode.OVERWRITE) {
                    List<Product> all = ProductDAO.getAllProducts();
                    for (Product p : all) ProductDAO.deleteProduct(p.getProductId());
                }
                if (mode == ImportMode.APPEND) {
                    for (Product p : ProductDAO.getAllProducts()) existingIds.add(p.getProductId());
                }
                reader.readNext(); // Skip header
                int rowNum = 2;
                while ((nextLine = reader.readNext()) != null) {
                    Product p = parseProductCsv(nextLine);
                    if (!validateProduct(p)) {
                        skipped.add("Row " + rowNum);
                        rowNum++;
                        continue;
                    }
                    if (mode == ImportMode.APPEND && existingIds.contains(p.getProductId())) {
                        skipped.add("Row " + rowNum);
                        rowNum++;
                        continue;
                    }
                    if (p != null && ProductDAO.insertProduct(p)) imported.add(p);
                    else skipped.add("Row " + rowNum);
                    rowNum++;
                }
                String msg = "Imported " + imported.size() + " products from CSV." + (skipped.isEmpty() ? "" : "\nSkipped rows: " + skipped);
                JOptionPane.showMessageDialog(this, msg);
                // --- Audit log ---
                hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                int sellerId = user != null ? user.getSellerId() : 0;
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                String details = "Imported products from: " + file.getAbsolutePath() + " (CSV)";
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "InventoryPanel", "Import", details));
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Import failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void importSuppliersXlsx() {
        ImportMode mode = promptImportMode();
        if (mode == null) return;
        String userHome = System.getProperty("user.home");
        JFileChooser chooser = new JFileChooser(new File(userHome, "Documents"));
        chooser.setDialogTitle("Open XLSX file for Suppliers");
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            File file = chooser.getSelectedFile();
            try (FileInputStream fis = new FileInputStream(file); Workbook workbook = new XSSFWorkbook(fis)) {
                Sheet sheet = workbook.getSheetAt(0);
                Iterator<Row> rowIterator = sheet.iterator();
                if (rowIterator.hasNext()) rowIterator.next(); // Skip header
                List<String> skipped = new ArrayList<>();
                if (mode == ImportMode.OVERWRITE) {
                    // Assuming a method to clear suppliers, if needed
                    // hardwarehub_main.dao.SupplierDAO.deleteAllSuppliers(); // Uncomment if such a method exists
                }
                while (rowIterator.hasNext()) {
                    Row row = rowIterator.next();
                    hardwarehub_main.model.Supplier sup = parseSupplierRow(row);
                    if (sup != null && hardwarehub_main.dao.SupplierDAO.insertSupplier(sup)) {
                        // Success
                    } else {
                        skipped.add("Row " + row.getRowNum() + 1);
                    }
                }
                String msg = "Imported suppliers from XLSX successfully." + (skipped.isEmpty() ? "" : "\nSkipped rows: " + skipped);
                JOptionPane.showMessageDialog(this, msg);
                // --- Audit log ---
                hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                int sellerId = user != null ? user.getSellerId() : 0;
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                String details = "Imported suppliers from: " + file.getAbsolutePath() + " (XLSX)";
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "InventoryPanel", "Import", details));
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Import failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void importSuppliersCsv() {
        ImportMode mode = promptImportMode();
        if (mode == null) return;
        String userHome = System.getProperty("user.home");
        JFileChooser chooser = new JFileChooser(new File(userHome, "Documents"));
        chooser.setDialogTitle("Open CSV file for Suppliers");
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            File file = chooser.getSelectedFile();
            try (CSVReader reader = new CSVReader(new FileReader(file))) {
                String[] nextLine;
                List<String> skipped = new ArrayList<>();
                if (mode == ImportMode.OVERWRITE) {
                    // Assuming a method to clear suppliers, if needed
                    // hardwarehub_main.dao.SupplierDAO.deleteAllSuppliers(); // Uncomment if such a method exists
                }
                reader.readNext(); // Skip header
                int rowNum = 2;
                while ((nextLine = reader.readNext()) != null) {
                    hardwarehub_main.model.Supplier sup = parseSupplierCsv(nextLine);
                    if (sup != null && hardwarehub_main.dao.SupplierDAO.insertSupplier(sup)) {
                        // Success
                    } else {
                        skipped.add("Row " + rowNum);
                    }
                    rowNum++;
                }
                String msg = "Imported suppliers from CSV successfully." + (skipped.isEmpty() ? "" : "\nSkipped rows: " + skipped);
                JOptionPane.showMessageDialog(this, msg);
                // --- Audit log ---
                hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                int sellerId = user != null ? user.getSellerId() : 0;
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                String details = "Imported suppliers from: " + file.getAbsolutePath() + " (CSV)";
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "InventoryPanel", "Import", details));
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Import failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private boolean validateProduct(Product p) {
        if (p == null) return false;
        if (p.getProductName() == null || p.getProductName().isEmpty()) return false;
        if (p.getCategory() == null || p.getCategory().isEmpty()) return false;
        if (p.getSupplierName() == null || p.getSupplierName().isEmpty()) return false;
        if (p.getUnitPrice() == null) return false;
        return true;
    }

    private int resolveCategoryId(String categoryDisplay) {
        // Try direct match first
        int catId = ProductDAO.getCategoryIdByName(categoryDisplay.trim());
        if (catId > 0) return catId;
        // Try to match 'ParentCat (ChildCat)' format
        Pattern p = Pattern.compile("^(.*?)\\s*\\((.*?)\\)\\s*$");
        Matcher m = p.matcher(categoryDisplay.trim());
        if (m.matches()) {
            String parent = m.group(1).trim();
            String child = m.group(2).trim();
            // Find all categories and match child with correct parent
            java.util.List<hardwarehub_main.model.Category> allCats = hardwarehub_main.dao.CategoryDAO.getAllCategories();
            for (hardwarehub_main.model.Category cat : allCats) {
                if (cat.getCategory().equalsIgnoreCase(child) && cat.getParentCategoryId() != null) {
                    hardwarehub_main.model.Category parentCat = hardwarehub_main.dao.CategoryDAO.getCategoryById(cat.getParentCategoryId());
                    if (parentCat != null && parentCat.getCategory().equalsIgnoreCase(parent)) {
                        return cat.getCategoryId();
                    }
                }
            }
        }
        // Try to match by removing leading whitespace (indented subcategories)
        String trimmed = categoryDisplay.replaceAll("^\\s+", "");
        catId = ProductDAO.getCategoryIdByName(trimmed);
        if (catId > 0) return catId;
        // Fallback: try matching just the child part if present
        if (m.matches()) {
            String child = m.group(2).trim();
            catId = ProductDAO.getCategoryIdByName(child);
            if (catId > 0) return catId;
        }
        return -1;
    }

    private Product parseProductRow(Row row) {
        try {
            int id = (int) row.getCell(0).getNumericCellValue();
            String name = row.getCell(1).getStringCellValue();
            String category = row.getCell(2).getStringCellValue();
            String supplier = row.getCell(3).getStringCellValue();
            BigDecimal price = new BigDecimal(row.getCell(4).getNumericCellValue());
            int quantity = (int) row.getCell(5).getNumericCellValue();
            int minThreshold = (int) row.getCell(6).getNumericCellValue();
            boolean available = false;
            if (row.getLastCellNum() > 7 && row.getCell(7) != null) {
                String availStr = row.getCell(7).getStringCellValue().trim().toLowerCase();
                available = availStr.equals("yes") || availStr.equals("1") || availStr.equals("true");
            } else {
                available = quantity > 0;
            }
            Product p = new Product();
            p.setProductId(id);
            p.setProductName(name);
            p.setCategory(category);
            p.setCategoryId(resolveCategoryId(category));
            p.setSupplierName(supplier);
            p.setSupplierId(hardwarehub_main.dao.SupplierDAO.getSupplierIdByName(supplier));
            p.setUnitPrice(price);
            p.setQuantity(quantity);
            p.setMinThreshold(minThreshold);
            p.setAvailable(available);
            return p;
        } catch (Exception e) {
            return null;
        }
    }

    private hardwarehub_main.model.Supplier parseSupplierRow(Row row) {
        try {
            int id = (int) row.getCell(0).getNumericCellValue();
            String name = row.getCell(1).getStringCellValue();
            String contactName = row.getCell(2).getStringCellValue();
            String contactNumber = row.getCell(3).getStringCellValue();
            String email = row.getCell(4).getStringCellValue();
            String address = row.getCell(5).getStringCellValue();
            boolean available = false;
            if (row.getLastCellNum() > 6 && row.getCell(6) != null) {
                String availStr = row.getCell(6).getStringCellValue().trim().toLowerCase();
                available = availStr.equals("yes") || availStr.equals("1") || availStr.equals("true");
            } else {
                available = true;
            }
            hardwarehub_main.model.Supplier sup = new hardwarehub_main.model.Supplier();
            sup.setSupplierId(id);
            sup.setSupplierName(name);
            sup.setContactName(contactName);
            sup.setContactNumber(contactNumber);
            sup.setEmail(email);
            sup.setAddress(address);
            sup.setAvailable(available);
            return sup;
        } catch (Exception e) {
            return null;
        }
    }

    private Product parseProductCsv(String[] line) {
        try {
            int id = Integer.parseInt(line[0]);
            String name = line[1];
            String category = line[2];
            String supplier = line[3];
            BigDecimal price = new BigDecimal(line[4]);
            int quantity = Integer.parseInt(line[5]);
            int minThreshold = Integer.parseInt(line[6]);
            boolean available = false;
            if (line.length > 7 && line[7] != null) {
                String availStr = line[7].trim().toLowerCase();
                available = availStr.equals("yes") || availStr.equals("1") || availStr.equals("true");
            } else {
                available = quantity > 0;
            }
            Product p = new Product();
            p.setProductId(id);
            p.setProductName(name);
            p.setCategory(category);
            p.setCategoryId(resolveCategoryId(category));
            p.setSupplierName(supplier);
            p.setSupplierId(hardwarehub_main.dao.SupplierDAO.getSupplierIdByName(supplier));
            p.setUnitPrice(price);
            p.setQuantity(quantity);
            p.setMinThreshold(minThreshold);
            p.setAvailable(available);
            return p;
        } catch (Exception e) {
            return null;
        }
    }

    private hardwarehub_main.model.Supplier parseSupplierCsv(String[] line) {
        try {
            int id = Integer.parseInt(line[0]);
            String name = line[1];
            String contactName = line[2];
            String contactNumber = line[3];
            String contact = line[4];
            String email = line[5];
            String address = line[6];
            boolean available = false;
            if (line.length > 7 && line[7] != null) {
                String availStr = line[7].trim().toLowerCase();
                available = availStr.equals("yes") || availStr.equals("1") || availStr.equals("true");
            } else {
                available = true;
            }
            hardwarehub_main.model.Supplier sup = new hardwarehub_main.model.Supplier();
            sup.setSupplierId(id);
            sup.setSupplierName(name);
            sup.setContactName(contactName);
            sup.setContactNumber(contactNumber);
            sup.setEmail(email);
            sup.setAddress(address);
            sup.setAvailable(available);
            return sup;
        } catch (Exception e) {
            return null;
        }
    }
} 