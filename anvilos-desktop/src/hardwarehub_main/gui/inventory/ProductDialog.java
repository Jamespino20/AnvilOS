package hardwarehub_main.gui.inventory;

import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.Product;
import hardwarehub_main.util.DialogUtils;
import java.awt.*;
import java.math.BigDecimal;
import javax.swing.*;

public class ProductDialog extends JDialog {

    private JTextField tfName, tfUnitPrice, tfQuantity, tfMinThreshold;
    private JComboBox<String> cbCategoryIndented;
    private JComboBox<String> cbSupplier;
    private boolean succeeded;

    private Product product;
    private java.util.Map<String, Integer> nameToId;
    private java.util.Set<Integer> nonLeafCategoryIds;

    public ProductDialog(Window owner, Product product) {
        super(owner, (product == null ? "Add New Product" : "Edit Product"), ModalityType.APPLICATION_MODAL);
        this.product = product;

        initComponents();
        populateComboBoxes();

        if (product != null) {
            fillFieldsWithProductData();
            // Restrict editing if unavailable
            if (!product.isAvailable()) {
                JOptionPane.showMessageDialog(this, "Unavailable products cannot be edited.", "Edit Restricted", JOptionPane.WARNING_MESSAGE);
                dispose();
                return;
            }
            tfName.setEditable(false);
            tfQuantity.setEditable(false);
        }

        pack();
        setLocationRelativeTo(owner);
        DialogUtils.bindEscapeKeyToClose(this);
    }

    private void initComponents() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(new Color(0xDBD3D8));  // Light background for dialog
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JLabel lblName = new JLabel("Product Name:");
        JLabel lblCategory = new JLabel("Category:");
        JLabel lblSupplier = new JLabel("Supplier:");
        JLabel lblUnitPrice = new JLabel("Unit Price:");
        JLabel lblQuantity = new JLabel("Quantity:");
        JLabel lblMinThreshold = new JLabel("Min Threshold:");

        tfName = new JTextField(20);
        tfUnitPrice = new JTextField(10);
        tfQuantity = new JTextField(10);
        tfMinThreshold = new JTextField(10);

        cbCategoryIndented = new JComboBox<>();
        cbSupplier = new JComboBox<>();

        // Row 0 - Product Name
        gbc.gridx = 0; gbc.gridy = 0;
        panel.add(lblName, gbc);
        gbc.gridx = 1;
        panel.add(tfName, gbc);

        // Row 1 - Category
        gbc.gridx = 0; gbc.gridy = 1;
        panel.add(lblCategory, gbc);
        gbc.gridx = 1;
        panel.add(cbCategoryIndented, gbc);

        // Row 2 - Supplier
        gbc.gridx = 0; gbc.gridy = 2;
        panel.add(lblSupplier, gbc);
        gbc.gridx = 1;
        panel.add(cbSupplier, gbc);

        // Row 3 - Unit Price
        gbc.gridx = 0; gbc.gridy = 3;
        panel.add(lblUnitPrice, gbc);
        gbc.gridx = 1;
        panel.add(tfUnitPrice, gbc);

        // Row 4 - Quantity
        gbc.gridx = 0; gbc.gridy = 4;
        panel.add(lblQuantity, gbc);
        gbc.gridx = 1;
        panel.add(tfQuantity, gbc);

        // Row 5 - Min Threshold
        gbc.gridx = 0; gbc.gridy = 5;
        panel.add(lblMinThreshold, gbc);
        gbc.gridx = 1;
        panel.add(tfMinThreshold, gbc);

        // Buttons Panel
        JPanel buttonsPanel = new JPanel();
        buttonsPanel.setBackground(new Color(0xA2AD59));

        JButton btnSave = new JButton("Save");
        JButton btnCancel = new JButton("Cancel");
        buttonsPanel.add(btnSave);
        buttonsPanel.add(btnCancel);

        btnSave.addActionListener(e -> onSave());
        btnCancel.addActionListener(e -> onCancel());

        getContentPane().add(panel, BorderLayout.CENTER);
        getContentPane().add(buttonsPanel, BorderLayout.SOUTH);

        getRootPane().setDefaultButton(btnSave);
    }

    private void populateComboBoxes() {
        java.util.List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
        cbCategoryIndented.removeAllItems();
        nameToId = new java.util.HashMap<>();
        nonLeafCategoryIds = new java.util.HashSet<>();
        // Build parent/child map
        java.util.Map<Integer, java.util.List<hardwarehub_main.model.Category>> parentToChildren = new java.util.HashMap<>();
        for (hardwarehub_main.model.Category c : categories) {
            parentToChildren.computeIfAbsent(c.getParentCategoryId(), k -> new java.util.ArrayList<>()).add(c);
        }
        // Mark non-leaf categories
        for (hardwarehub_main.model.Category c : categories) {
            if (parentToChildren.containsKey(c.getCategoryId())) {
                nonLeafCategoryIds.add(c.getCategoryId());
            }
        }
        java.util.function.BiConsumer<java.util.List<hardwarehub_main.model.Category>, Integer> addIndented = new java.util.function.BiConsumer<>() {
            @Override
            public void accept(java.util.List<hardwarehub_main.model.Category> cats, Integer level) {
                for (hardwarehub_main.model.Category cat : cats) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < level; i++) sb.append("    ");
                    sb.append(cat.getCategory());
                    cbCategoryIndented.addItem(sb.toString());
                    nameToId.put(sb.toString(), cat.getCategoryId());
                    // Find children
                    java.util.List<hardwarehub_main.model.Category> children = parentToChildren.get(cat.getCategoryId());
                    if (children != null) accept(children, level + 1);
                }
            }
        };
        java.util.List<hardwarehub_main.model.Category> roots = parentToChildren.get(null);
        if (roots != null) addIndented.accept(roots, 0);
        // Custom renderer to gray out non-leaf categories
        cbCategoryIndented.setRenderer(new DefaultListCellRenderer() {
            @Override
            public Component getListCellRendererComponent(JList<?> list, Object value, int index, boolean isSelected, boolean cellHasFocus) {
                Component c = super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus);
                if (index >= 0) {
                    Integer catId = nameToId.get(value);
                    if (catId != null && nonLeafCategoryIds.contains(catId)) {
                        c.setForeground(Color.GRAY);
                    } else {
                        c.setForeground(isSelected ? list.getSelectionForeground() : list.getForeground());
                    }
                }
                return c;
            }
        });

        // Load suppliers from SupplierDAO
        java.util.List<String> suppliers = hardwarehub_main.dao.SupplierDAO.getAllSupplierNames();
        cbSupplier.removeAllItems();
        for (String s : suppliers) {
            cbSupplier.addItem(s);
        }
    }


    private void fillFieldsWithProductData() {
        tfName.setText(product.getProductName());
        cbCategoryIndented.setSelectedItem(product.getCategory());
        cbSupplier.setSelectedItem(product.getSupplierName());
        tfUnitPrice.setText(product.getUnitPrice().toPlainString());
        tfQuantity.setText(String.valueOf(product.getQuantity()));
        tfMinThreshold.setText(String.valueOf(product.getMinThreshold()));
    }

    private void onSave() {
        if (!validateInputs()) {
            return;
        }
        String name = tfName.getText().trim();
        String category = (String) cbCategoryIndented.getSelectedItem();
        Integer categoryId = nameToId.get(category);
        if (categoryId == null || nonLeafCategoryIds.contains(categoryId)) {
            JOptionPane.showMessageDialog(this, "Please select a subcategory (leaf category) for the product.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            cbCategoryIndented.requestFocus();
            return;
        }
        String supplier = (String) cbSupplier.getSelectedItem();
        BigDecimal unitPrice = new BigDecimal(tfUnitPrice.getText().trim());
        if (unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            JOptionPane.showMessageDialog(this, "Unit Price cannot be negative.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            tfUnitPrice.requestFocus();
            return;
        }
        int quantity = Integer.parseInt(tfQuantity.getText().trim());
        int minThreshold = Integer.parseInt(tfMinThreshold.getText().trim());
        int supplierId = hardwarehub_main.dao.SupplierDAO.getSupplierIdByName(supplier);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
        int sellerId = user != null ? user.getSellerId() : 1; // fallback to 1 if not logged in
        String sellerName = user != null ? user.getSellerName() : "Unknown";
        if (product == null) {
            // Add new product
            Product newProduct = new Product();
            newProduct.setProductName(name);
            newProduct.setCategoryId(categoryId);
            newProduct.setCategory(category);
            newProduct.setSupplierId(supplierId);
            newProduct.setSupplierName(supplier);
            newProduct.setUnitPrice(unitPrice);
            newProduct.setQuantity(quantity);
            newProduct.setMinThreshold(minThreshold);
            newProduct.setCreatedAt(now);
            newProduct.setUpdatedAt(now);
            if (ProductDAO.insertProduct(newProduct)) {
                // Audit log for add
                String details = "Added product: " + name + " by " + sellerName;
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "ProductDialog", "Add Product", details));
                succeeded = true;
                dispose();
            } else {
                JOptionPane.showMessageDialog(this, "Failed to add product.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        } else {
            // Update existing product (only price, supplier, minThreshold)
            product.setCategoryId(categoryId);
            product.setCategory(category);
            product.setSupplierId(supplierId);
            product.setSupplierName(supplier);
            product.setUnitPrice(unitPrice);
            product.setMinThreshold(minThreshold);
            product.setUpdatedAt(now);
            if (ProductDAO.updateProduct(product)) {
                // Audit log for edit
                String details = "Edited product: " + product.getProductName() + " (ID: " + product.getProductId() + ") by " + sellerName;
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "ProductDialog", "Edit Product", details));
                succeeded = true;
                dispose();
            } else {
                JOptionPane.showMessageDialog(this, "Failed to update product.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private boolean validateInputs() {
        if (tfName.getText().trim().isEmpty()) {
            JOptionPane.showMessageDialog(this, "Product Name is required.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            tfName.requestFocus();
            return false;
        }
        if (cbCategoryIndented.getSelectedItem() == null) {
            JOptionPane.showMessageDialog(this, "Select a Category.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            cbCategoryIndented.requestFocus();
            return false;
        }
        if (cbSupplier.getSelectedItem() == null) {
            JOptionPane.showMessageDialog(this, "Select a Supplier.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            cbSupplier.requestFocus();
            return false;
        }
        try {
            new BigDecimal(tfUnitPrice.getText().trim());
        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(this, "Unit Price must be a valid decimal number.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            tfUnitPrice.requestFocus();
            return false;
        }
        try {
            int q = Integer.parseInt(tfQuantity.getText().trim());
            if (q < 0) throw new NumberFormatException();
        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(this, "Quantity must be a non-negative integer.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            tfQuantity.requestFocus();
            return false;
        }
        try {
            int m = Integer.parseInt(tfMinThreshold.getText().trim());
            if (m < 0) throw new NumberFormatException();
        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(this, "Min Threshold must be a non-negative integer.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            tfMinThreshold.requestFocus();
            return false;
        }
        return true;
    }

    private void onCancel() {
        succeeded = false;
        dispose();
    }

    public boolean isSucceeded() {
        return succeeded;
    }
}
