package hardwarehub_main.gui.inventory;

import hardwarehub_main.dao.AuditLogDAO;
import hardwarehub_main.dao.CategoryDAO;
import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.dao.SupplierDAO;
import hardwarehub_main.model.AuditLog;
import hardwarehub_main.model.Category;
import hardwarehub_main.model.Product;
import hardwarehub_main.model.Supplier;
import hardwarehub_main.model.User;
import java.awt.Component;
import java.time.LocalDateTime;
import java.util.*;
import javax.swing.*;

public class CategoryBulkMarker {
    public static void bulkMarkCategories(List<Category> categories, List<JCheckBox> checkBoxes, Component parent) {
        User user = User.getCurrentUser();
        String sellerName = user != null ? user.getSellerName() : "Unknown";
        LocalDateTime now = LocalDateTime.now();
        int catChanged = 0, prodChanged = 0;
        Set<Integer> updatedCatIds = new HashSet<>();
        for (int i = 0; i < categories.size(); i++) {
            Category cat = categories.get(i);
            boolean newAvail = checkBoxes.get(i).isSelected();
            if (cat.isAvailable() != newAvail) {
                // If enabling, check parent
                if (newAvail && cat.getParentCategoryId() != null) {
                    Category parentCat = CategoryDAO.getCategoryById(cat.getParentCategoryId());
                    if (parentCat != null && !parentCat.isAvailable()) {
                        JOptionPane.showMessageDialog(parent, "Cannot enable '" + cat.getCategory() + "' because its parent category is unavailable.", "Error", JOptionPane.ERROR_MESSAGE);
                        continue;
                    }
                }
                // Recursively mark children if disabling
                if (!newAvail) {
                    prodChanged += recursivelyMarkCategoryAndChildrenUnavailable(cat, sellerName, now, updatedCatIds, parent);
                } else {
                    // Enabling: only enable if parent is available, and products if supplier is available
                    cat.setAvailable(true);
                    cat.setUpdatedAt(now);
                    boolean success = CategoryDAO.updateCategory(cat);
                    String details = "Bulk marked category available: " + cat.getCategory() + " (ID: " + cat.getCategoryId() + ") by " + sellerName;
                    AuditLogDAO.insertAuditLog(new AuditLog(0, 0, now, success, "InventoryPanel", "Bulk Mark Available", details));
                    updatedCatIds.add(cat.getCategoryId());
                    catChanged++;
                    // Enable products if supplier is available
                    List<Product> products = ProductDAO.getProductsByCategory(cat.getCategory());
                    for (Product p : products) {
                        Supplier sup = SupplierDAO.getSupplierById(p.getSupplierId());
                        boolean canEnable = sup != null && sup.isAvailable();
                        if (canEnable) {
                            p.setAvailable(true);
                            p.setUpdatedAt(now);
                            boolean prodSuccess = ProductDAO.updateProduct(p);
                            String prodDetails = "Bulk marked product available: " + p.getProductName() + " (ID: " + p.getProductId() + ") by " + sellerName + " (Category: " + cat.getCategory() + ")";
                            AuditLogDAO.insertAuditLog(new AuditLog(0, 0, now, prodSuccess, "InventoryPanel", "Bulk Mark Available", prodDetails));
                            prodChanged++;
                        }
                    }
                }
            }
        }
        JOptionPane.showMessageDialog(parent, "Bulk marking complete. Categories changed: " + updatedCatIds.size() + ", Products changed: " + prodChanged + ".");
    }

    // Helper: recursively mark category and all children unavailable, and all products under them
    private static int recursivelyMarkCategoryAndChildrenUnavailable(Category cat, String sellerName, LocalDateTime now, Set<Integer> updatedCatIds, Component parent) {
        int prodChanged = 0;
        if (!updatedCatIds.contains(cat.getCategoryId())) {
            cat.setAvailable(false);
            cat.setUpdatedAt(now);
            boolean success = CategoryDAO.updateCategory(cat);
            String details = "Bulk marked category unavailable: " + cat.getCategory() + " (ID: " + cat.getCategoryId() + ") by " + sellerName;
            AuditLogDAO.insertAuditLog(new AuditLog(0, 0, now, success, "InventoryPanel", "Bulk Mark Unavailable", details));
            updatedCatIds.add(cat.getCategoryId());
        }
        List<Product> products = ProductDAO.getProductsByCategory(cat.getCategory());
        for (Product p : products) {
            if (p.isAvailable()) {
                p.setAvailable(false);
                p.setUpdatedAt(now);
                boolean prodSuccess = ProductDAO.updateProduct(p);
                String prodDetails = "Bulk marked product unavailable: " + p.getProductName() + " (ID: " + p.getProductId() + ") by " + sellerName + " (Category: " + cat.getCategory() + ")";
                AuditLogDAO.insertAuditLog(new AuditLog(0, 0, now, prodSuccess, "InventoryPanel", "Bulk Mark Unavailable", prodDetails));
                prodChanged++;
            }
        }
        List<Category> allCats = CategoryDAO.getAllCategories();
        for (Category child : allCats) {
            Integer parentId = child.getParentCategoryId();
            if (parentId != null && parentId.equals(cat.getCategoryId())) {
                prodChanged += recursivelyMarkCategoryAndChildrenUnavailable(child, sellerName, now, updatedCatIds, parent);
            }
        }
        return prodChanged;
    }
} 