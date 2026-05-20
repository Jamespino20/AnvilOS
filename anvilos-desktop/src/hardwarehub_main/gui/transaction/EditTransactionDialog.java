package hardwarehub_main.gui.transaction;

import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.Product;
import hardwarehub_main.model.Transaction;
import hardwarehub_main.model.TransactionItem;
import java.awt.*;
import java.math.BigDecimal;
import java.util.List;
import javax.swing.*;
import javax.swing.table.DefaultTableModel;

public class EditTransactionDialog extends JDialog {

    private Transaction transaction;
    private List<Product> allProducts;
    private DefaultTableModel tableModel;
    private JComboBox<String> statusCombo;
    private JTextField tfGrandTotal;
    private JButton btnAddProduct;
    private JButton btnRemoveProduct;
    private JButton btnCancelEdit;
    private boolean updated = false;
    private javax.swing.event.TableModelListener totalsListener;

    public EditTransactionDialog(Window owner, Transaction txn) {
        super(owner, "Edit Transaction", ModalityType.APPLICATION_MODAL);
        // 1. Restrict editing to ongoing transactions only (after super)
        if (!"Ongoing".equalsIgnoreCase(txn.getTransactionStatus())) {
            JOptionPane.showMessageDialog(owner, "Only ongoing transactions can be edited.", "Edit Not Allowed", JOptionPane.WARNING_MESSAGE);
            dispose();
            return;
        }
        this.transaction = txn;
        this.allProducts = ProductDAO.getAllProducts();
        setLayout(new BorderLayout(4, 4));
        setSize(700, 380);
        setLocationRelativeTo(owner);

        // --- Status and Buttons panel at the top ---
        JPanel topPanel = new JPanel(new GridBagLayout());
        GridBagConstraints tgbc = new GridBagConstraints();
        tgbc.insets = new Insets(2, 2, 2, 2);
        tgbc.gridx = 0; tgbc.gridy = 0; tgbc.anchor = GridBagConstraints.WEST;
        topPanel.add(new JLabel("Status:"), tgbc);
        tgbc.gridx++;
        statusCombo = new JComboBox<>(new String[]{"Ongoing", "Completed", "Cancelled"});
        statusCombo.setSelectedItem(txn.getTransactionStatus());
        statusCombo.setPreferredSize(new Dimension(110, 24));
        topPanel.add(statusCombo, tgbc);
        tgbc.gridx++;
        tgbc.weightx = 1.0;
        topPanel.add(Box.createHorizontalGlue(), tgbc);
        tgbc.gridx++; tgbc.weightx = 0;
        JButton btnAdd = new JButton("Add");
        btnAdd.setPreferredSize(new Dimension(90, 26));
        btnAddProduct = btnAdd;
        topPanel.add(btnAdd, tgbc);
        tgbc.gridx++;
        JButton btnRemove = new JButton("Remove");
        btnRemove.setPreferredSize(new Dimension(90, 26));
        btnRemoveProduct = btnRemove;
        topPanel.add(btnRemove, tgbc);
        tgbc.gridx++;
        JButton btnSave = new JButton("Save");
        btnSave.setPreferredSize(new Dimension(90, 26));
        topPanel.add(btnSave, tgbc);
        tgbc.gridx++;
        JButton btnCancel = new JButton("Cancel");
        btnCancel.setPreferredSize(new Dimension(90, 26));
        btnCancelEdit = btnCancel;
        topPanel.add(btnCancel, tgbc);
        add(topPanel, BorderLayout.NORTH);

        // Table for items
        String[] columns = {"Product", "Quantity", "Unit Price", "Total Price"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int r, int c) {
                return false;
            }
        };
        JTable table = new JTable(tableModel);
        JScrollPane scroll = new JScrollPane(table);
        scroll.setPreferredSize(new Dimension(600, 120));
        add(scroll, BorderLayout.CENTER);

        // Populate table
        for (TransactionItem item : txn.getTransactionItems()) {
            tableModel.addRow(new Object[]{item.getProductName(), item.getQuantity(), item.getUnitPrice(), item.getTotalPrice()});
        }

        // Grand total panel
        JPanel totalPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 4, 2));
        totalPanel.add(new JLabel("Grand Total:"));
        tfGrandTotal = new JTextField(10);
        tfGrandTotal.setEditable(false);
        tfGrandTotal.setPreferredSize(new Dimension(90, 24));
        totalPanel.add(tfGrandTotal);
        add(totalPanel, BorderLayout.SOUTH);

        // --- Edit panel for category, product, quantity, update ---
        JPanel editPanel = new JPanel(new GridBagLayout());
        JComboBox<String> cbCategory = new JComboBox<>();
        JComboBox<String> cbProduct = new JComboBox<>();
        JSpinner spQuantity = new JSpinner(new SpinnerNumberModel(1, 1, 10000, 1));
        JButton btnUpdate = new JButton("Update");
        cbCategory.setPreferredSize(new Dimension(120, 22));
        cbProduct.setPreferredSize(new Dimension(150, 22));
        spQuantity.setPreferredSize(new Dimension(50, 22));
        btnUpdate.setPreferredSize(new Dimension(80, 22));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(2, 2, 2, 2);
        gbc.gridx = 0;
        gbc.gridy = 0;
        editPanel.add(new JLabel("Category:"), gbc);
        gbc.gridx = 1;
        editPanel.add(cbCategory, gbc);
        gbc.gridx = 2;
        editPanel.add(new JLabel("Product:"), gbc);
        gbc.gridx = 3;
        editPanel.add(cbProduct, gbc);
        gbc.gridx = 4;
        editPanel.add(new JLabel("Qty:"), gbc);
        gbc.gridx = 5;
        editPanel.add(spQuantity, gbc);
        gbc.gridx = 6;
        editPanel.add(btnUpdate, gbc);
        gbc.gridx = 7;
        gbc.weightx = 1.0;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        editPanel.add(Box.createHorizontalGlue(), gbc);
        add(editPanel, BorderLayout.PAGE_END);

        // --- Populate category dropdown with only leaf (child) categories ---
        java.util.List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
        java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory = new java.util.HashMap<>();
        java.util.Set<Integer> nonLeafCategoryIds = new java.util.HashSet<>();
        for (hardwarehub_main.model.Category c : categories) {
            idToCategory.put(c.getCategoryId(), c);
        }
        for (hardwarehub_main.model.Category c : categories) {
            if (c.getParentCategoryId() != null) {
                nonLeafCategoryIds.add(c.getParentCategoryId());
            }
        }
        java.util.function.BiConsumer<java.util.List<hardwarehub_main.model.Category>, Integer> addIndented = new java.util.function.BiConsumer<>() {
            @Override
            public void accept(java.util.List<hardwarehub_main.model.Category> cats, Integer level) {
                for (hardwarehub_main.model.Category cat : cats) {
                    if (!cat.isAvailable()) {
                        continue;
                    }
                    if (nonLeafCategoryIds.contains(cat.getCategoryId())) {
                        // Parent, skip adding
                        // But still recurse to children
                    } else {
                        StringBuilder sb = new StringBuilder();
                        for (int i = 0; i < level; i++) {
                            sb.append("    ");
                        }
                        sb.append(cat.getCategory());
                        cbCategory.addItem(sb.toString());
                    }
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
        java.util.List<hardwarehub_main.model.Category> roots = new java.util.ArrayList<>();
        for (hardwarehub_main.model.Category c : categories) {
            if (c.getParentCategoryId() == null) {
                roots.add(c);
            }
        }
        addIndented.accept(roots, 0);

        // --- Populate product dropdown when category changes ---
        cbCategory.addActionListener(e -> {
            cbProduct.removeAllItems();
            String selectedCat = (String) cbCategory.getSelectedItem();
            if (selectedCat == null) {
                return;
            }
            Integer catId = null;
            for (hardwarehub_main.model.Category c : categories) {
                StringBuilder sb = new StringBuilder();
                int depth = 0;
                Integer parentId = c.getParentCategoryId();
                while (parentId != null && idToCategory.containsKey(parentId)) {
                    depth++;
                    parentId = idToCategory.get(parentId).getParentCategoryId();
                }
                for (int i = 0; i < depth; i++) {
                    sb.append("    ");
                }
                sb.append(c.getCategory());
                if (sb.toString().equals(selectedCat)) {
                    catId = c.getCategoryId();
                    break;
                }
            }
            if (catId == null) {
                return;
            }
            for (Product p : allProducts) {
                if (p.isAvailable() && p.getCategoryId() == catId) {
                    cbProduct.addItem(p.getProductName() + " (" + p.getSupplierName() + ")");
                }
            }
        });

        // --- Table row selection updates controls ---
        table.getSelectionModel().addListSelectionListener(e -> {
            int row = table.getSelectedRow();
            if (row < 0) {
                return;
            }
            String prodName = tableModel.getValueAt(row, 0).toString();
            int qty = Integer.parseInt(tableModel.getValueAt(row, 1).toString());
            Product prod = null;
            for (Product p : allProducts) {
                if (p.getProductName().equals(prodName)) {
                    prod = p;
                    break;
                }
            }
            if (prod != null) {
                // Set category dropdown (match indented string)
                StringBuilder catIndent = new StringBuilder();
                int depth = 0;
                Integer parentId = prod.getCategoryId();
                while (parentId != null && idToCategory.containsKey(parentId)) {
                    depth++;
                    parentId = idToCategory.get(parentId).getParentCategoryId();
                }
                for (int i = 0; i < depth; i++) {
                    catIndent.append("    ");
                }
                String catName = catIndent + idToCategory.get(prod.getCategoryId()).getCategory();
                for (int i = 0; i < cbCategory.getItemCount(); i++) {
                    if (cbCategory.getItemAt(i).trim().equals(catName.trim())) {
                        cbCategory.setSelectedIndex(i);
                        break;
                    }
                }
                // Set product dropdown
                cbProduct.removeAllItems();
                for (Product p : allProducts) {
                    if (p.isAvailable() && p.getCategoryId() == prod.getCategoryId()) {
                        cbProduct.addItem(p.getProductName() + " (" + p.getSupplierName() + ")");
                    }
                }
                for (int i = 0; i < cbProduct.getItemCount(); i++) {
                    if (cbProduct.getItemAt(i).startsWith(prod.getProductName() + " (")) {
                        cbProduct.setSelectedIndex(i);
                        break;
                    }
                }
                // Set quantity
                spQuantity.setValue(qty);
            }
        });
        
        btnCancel.addActionListener(e -> dispose());

        // --- Add button adds a new product to the table ---
        btnAdd.addActionListener(e -> {
            // Show all available products in a scrollable dialog, proper naming
            List<Product> availableProducts = allProducts.stream()
                    .filter(Product::isAvailable)
                    .collect(java.util.stream.Collectors.toList());
            if (availableProducts.isEmpty()) {
                JOptionPane.showMessageDialog(this, "No available products to add.", "Info", JOptionPane.INFORMATION_MESSAGE);
                return;
            }
            for (hardwarehub_main.model.Category c : categories) {
                idToCategory.put(c.getCategoryId(), c);
            }

            java.util.Map<String, Product> displayToProduct = new java.util.LinkedHashMap<>();
            for (Product p : availableProducts) {
                // Build full category path
                StringBuilder catPath = new StringBuilder();
                Integer cid = p.getCategoryId();
                java.util.List<String> catNames = new java.util.ArrayList<>();
                while (cid != null && idToCategory.containsKey(cid)) {
                    hardwarehub_main.model.Category cat = idToCategory.get(cid);
                    catNames.add(0, cat.getCategory());
                    cid = cat.getParentCategoryId();
                }
                String catDisplay = String.join("/", catNames);
                String display = "[" + catDisplay + "] " + p.getProductName() + " (" + p.getSupplierName() + ")";
                displayToProduct.put(display, p);
            }
            JList<String> prodList = new JList<>(displayToProduct.keySet().toArray(new String[0]));
            prodList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
            JScrollPane scrollPane = new JScrollPane(prodList);
            scrollPane.setPreferredSize(new Dimension(450, 320));
            int result = JOptionPane.showConfirmDialog(this, scrollPane, "Select Product to Add", JOptionPane.OK_CANCEL_OPTION);
            if (result == JOptionPane.OK_OPTION && prodList.getSelectedValue() != null) {
                Product selected = displayToProduct.get(prodList.getSelectedValue());
                // Prompt for quantity
                String qtyStr = JOptionPane.showInputDialog(this, "Enter quantity:", "1");
                if (qtyStr == null) {
                    return;
                }
                int qty = 1;
                try {
                    qty = Integer.parseInt(qtyStr);
                    if (qty <= 0) {
                        throw new NumberFormatException();
                    }
                } catch (NumberFormatException ex) {
                    JOptionPane.showMessageDialog(this, "Invalid quantity.", "Error", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                BigDecimal unitPrice = selected.getUnitPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(qty));
                tableModel.addRow(new Object[]{selected.getProductName(), qty, unitPrice, totalPrice});
                updateTotals();
            }
        });
        
        // --- Remove button to remove products in the table ---
        btnRemove.addActionListener(e -> {
            int row = table.getSelectedRow();
            if (row >= 0) {
                tableModel.removeRow(row);
                updateTotals();
            } else {
                JOptionPane.showMessageDialog(this, "Select a row to remove.", "No Row Selected", JOptionPane.WARNING_MESSAGE);
            }
        });

        // --- Update button updates the selected row in the table ---
        btnUpdate.addActionListener(e -> {
            int row = table.getSelectedRow();
            if (row < 0) {
                JOptionPane.showMessageDialog(this, "Select a row to update.", "No Row Selected", JOptionPane.WARNING_MESSAGE);
                return;
            }
            String selectedCat = (String) cbCategory.getSelectedItem();
            String selectedProd = (String) cbProduct.getSelectedItem();
            if (selectedCat == null || selectedProd == null) {
                JOptionPane.showMessageDialog(this, "Select a valid category and product.", "Invalid Selection", JOptionPane.WARNING_MESSAGE);
                return;
            }
            // Find category ID
            Integer catId = null;
            for (hardwarehub_main.model.Category c : categories) {
                StringBuilder sb = new StringBuilder();
                int depth = 0;
                Integer parentId = c.getParentCategoryId();
                while (parentId != null && idToCategory.containsKey(parentId)) {
                    depth++;
                    parentId = idToCategory.get(parentId).getParentCategoryId();
                }
                for (int i = 0; i < depth; i++) {
                    sb.append("    ");
                }
                sb.append(c.getCategory());
                if (sb.toString().equals(selectedCat)) {
                    catId = c.getCategoryId();
                    break;
                }
            }
            if (catId == null) {
                JOptionPane.showMessageDialog(this, "Invalid category selected.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            // Parse product name and supplier
            int idx = selectedProd.lastIndexOf(" (");
            String prodName = idx > 0 ? selectedProd.substring(0, idx) : selectedProd;
            String supplierName = (idx > 0 && selectedProd.endsWith(")")) ? selectedProd.substring(idx + 2, selectedProd.length() - 1) : null;
            Product prod = null;
            for (Product p : allProducts) {
                if (p.getProductName().equals(prodName) && (supplierName == null || p.getSupplierName().equals(supplierName)) && p.getCategoryId() == catId) {
                    prod = p;
                    break;
                }
            }
            if (prod == null) {
                JOptionPane.showMessageDialog(this, "Invalid product selected.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            int qty = (int) spQuantity.getValue();
            BigDecimal unitPrice = prod.getUnitPrice();
            BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(qty));
            tableModel.setValueAt(prod.getProductName(), row, 0);
            tableModel.setValueAt(qty, row, 1);
            tableModel.setValueAt(unitPrice, row, 2);
            tableModel.setValueAt(totalPrice, row, 3);
            updateTotals();
        });

        // --- On dialog open, select first row and update controls ---
        if (tableModel.getRowCount() > 0) {
            table.setRowSelectionInterval(0, 0);
        }

        // Auto-calc on edit
        totalsListener = e -> updateTotals();
        tableModel.addTableModelListener(totalsListener);
        updateTotals();

        btnSave.addActionListener(e -> {
            if (tableModel.getRowCount() == 0) {
                JOptionPane.showMessageDialog(this, "At least one product required.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            List<TransactionItem> items = new java.util.ArrayList<>();
            for (int i = 0; i < tableModel.getRowCount(); i++) {
                String prodName = tableModel.getValueAt(i, 0).toString();
                int qty = Integer.parseInt(tableModel.getValueAt(i, 1).toString());
                Product prod = null;
                for (Product p : allProducts) {
                    if (p.getProductName().equals(prodName)) {
                        prod = p;
                        break;
                    }
                }
                if (prod == null) {
                    continue;
                }
                BigDecimal unitPrice = prod.getUnitPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(qty));
                TransactionItem item = new TransactionItem();
                item.setProductId(prod.getProductId());
                item.setProductName(prod.getProductName());
                item.setQuantity(qty);
                item.setUnitPrice(unitPrice);
                item.setTotalPrice(totalPrice);
                items.add(item);
            }
            transaction.getTransactionItems().clear();
            transaction.getTransactionItems().addAll(items);
            transaction.setGrandTotal(new BigDecimal(tfGrandTotal.getText()));
            transaction.setTransactionStatus((String) statusCombo.getSelectedItem());
            updated = true;
            dispose();
        });
    }

    private void updateTotals() {
        BigDecimal grandTotal = BigDecimal.ZERO;
        // Remove listener to prevent recursion
        tableModel.removeTableModelListener(totalsListener);
        try {
            for (int i = 0; i < tableModel.getRowCount(); i++) {
                try {
                    int qty = Integer.parseInt(tableModel.getValueAt(i, 1).toString());
                    BigDecimal unitPrice = new BigDecimal(tableModel.getValueAt(i, 2).toString());
                    BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(qty));
                    tableModel.setValueAt(total, i, 3);
                    grandTotal = grandTotal.add(total);
                } catch (Exception ex) {
                    // ignore
                }
            }
            tfGrandTotal.setText(grandTotal.toPlainString());
        } finally {
            // Re-add listener
            tableModel.addTableModelListener(totalsListener);
        }
    }

    public boolean isUpdated() {
        return updated;
    }
}
