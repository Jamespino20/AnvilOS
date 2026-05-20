package hardwarehub_main.gui.pos;

import hardwarehub_main.dao.CategoryDAO;
import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.dao.TransactionDAO;
import hardwarehub_main.model.Category;
import hardwarehub_main.model.Product;
import hardwarehub_main.model.Transaction;
import hardwarehub_main.model.TransactionItem;
import hardwarehub_main.model.User;
import hardwarehub_main.util.IconUtil;
import hardwarehub_main.util.UIConstants;
import org.pushingpixels.substance.api.skin.BusinessBlueSteelSkin;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ItemEvent;
import java.awt.event.KeyEvent;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import javax.swing.JOptionPane;
import javax.swing.table.DefaultTableModel;
import org.pushingpixels.substance.api.SubstanceCortex;
import java.util.Random;
import javax.swing.JSpinner;
import javax.swing.SpinnerNumberModel;
import javax.swing.Box;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.GridBagConstraints;
import javax.swing.JLabel;
import javax.swing.SwingConstants;
import java.awt.event.KeyAdapter;
import javax.swing.JPopupMenu;
import javax.swing.JMenuItem;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import javax.swing.SwingWorker;
import hardwarehub_login.LoaderDialog;
import java.util.HashMap;
import java.util.Map;

public class POSPanel extends JPanel implements hardwarehub_main.util.JMenuBarProvider {

    private JComboBox<String> cbTransactionType;
    private JComboBox<String> cbCategory;
    private JTextField tfBuyerName;
    private JTextField tfBuyerContact;
    private JTextField tfBuyerAddress;
    private JTextField tfTotalPrice;
    private JTextField tfCashReceived;
    private JTextField tfChange;
    private JTextField tfGrandTotal;
    private JTable orderTable;
    private DefaultTableModel orderTableModel;
    private JButton btnAddToOrder;
    private JButton btnRemoveFromOrder;
    private JComboBox<String> cbDeliveryMethod;
    private JTextField tfProductSearch;
    private JSpinner spQuantity;

    private static final String[] DELIVERY_METHODS = {"Pickup", "Delivery", "COD", "Walk-In"};

    private JWindow productSuggestionWindow;
    private JList<String> suggestionList;
    private java.util.List<String> currentProductSuggestions = new java.util.ArrayList<>();

    // Glass pane loader overlay for dashboard return
    private JPanel loaderPane = null;

    private String currentTxnType = "Sale Walk-In";

    private boolean isProgrammaticComboChange = false;

    public POSPanel() {
        super(new BorderLayout());
        setBackground(UIConstants.BACKGROUND);
        // Set menu bar if parent is JFrame
        SwingUtilities.invokeLater(() -> {
            java.awt.Window w = SwingUtilities.getWindowAncestor(this);
            if (w instanceof JFrame frame) {
                frame.setJMenuBar(createMenuBar());
            }
        });

        // Ribbon
        JToolBar ribbon = createRibbon();
        add(ribbon, BorderLayout.NORTH);

        // Main split layout: left (inputs) and right (order table)
        JPanel mainPanel = new JPanel(new BorderLayout());
        mainPanel.setBackground(UIConstants.PANEL_BG);
        mainPanel.setBorder(new EmptyBorder(20, 20, 20, 20));

        // --- Left: Input Fields (GridBagLayout for alignment) ---
        JPanel leftPanel = new JPanel(new GridBagLayout());
        leftPanel.setBackground(UIConstants.PANEL_BG);
        leftPanel.setBorder(new EmptyBorder(10, 10, 10, 10));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 0, 0, 0); // vertical padding
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        // Transaction Type
        leftPanel.add(makeLabel("Transaction Type:"), gbc);
        gbc.gridy++;
        leftPanel.add(cbTransactionType = new JComboBox<>(new String[]{
            "Sale Walk-In", "Sale PO", "Restock", "Adjustment", "Return", "Damage"
        }), gbc);
        cbTransactionType.setPreferredSize(new Dimension(220, 28));
        // Product Category
        gbc.gridy++;
        leftPanel.add(makeLabel("Product Category:"), gbc);
        gbc.gridy++;
        leftPanel.add(cbCategory = new JComboBox<>(), gbc);
        cbCategory.setPreferredSize(new Dimension(220, 28));
        // Product
        gbc.gridy++;
        leftPanel.add(makeLabel("Product:"), gbc);
        gbc.gridy++;
        leftPanel.add(tfProductSearch = new JTextField(20), gbc);
        tfProductSearch.setPreferredSize(new Dimension(220, 28));
        // Quantity
        gbc.gridy++;
        leftPanel.add(makeLabel("Quantity:"), gbc);
        gbc.gridy++;
        leftPanel.add(spQuantity = new JSpinner(new SpinnerNumberModel(1, 1, 10000, 1)), gbc);
        spQuantity.setPreferredSize(new Dimension(220, 28));
        // Total Price (moved back to left panel)
        gbc.gridy++;
        leftPanel.add(makeLabel("Total Price:"), gbc);
        gbc.gridy++;
        tfTotalPrice = new JTextField(12);
        tfTotalPrice.setEditable(false);
        tfTotalPrice.setFont(new Font("Arial", Font.BOLD, 16));
        leftPanel.add(tfTotalPrice, gbc);
        // Buyer Name
        gbc.gridy++;
        leftPanel.add(makeLabel("Buyer Name:"), gbc);
        gbc.gridy++;
        leftPanel.add(tfBuyerName = new JTextField(20), gbc);
        tfBuyerName.setPreferredSize(new Dimension(220, 28));
        // Buyer Contact
        gbc.gridy++;
        leftPanel.add(makeLabel("Buyer Contact:"), gbc);
        gbc.gridy++;
        leftPanel.add(tfBuyerContact = new JTextField(20), gbc);
        tfBuyerContact.setPreferredSize(new Dimension(220, 28));
        // Buyer Address
        gbc.gridy++;
        leftPanel.add(makeLabel("Buyer Address:"), gbc);
        gbc.gridy++;
        leftPanel.add(tfBuyerAddress = new JTextField(30), gbc);
        tfBuyerAddress.setPreferredSize(new Dimension(220, 28));
        // Delivery Method
        gbc.gridy++;
        leftPanel.add(makeLabel("Delivery Method:"), gbc);
        gbc.gridy++;
        leftPanel.add(cbDeliveryMethod = new JComboBox<>(DELIVERY_METHODS), gbc);
        cbDeliveryMethod.setPreferredSize(new Dimension(220, 28));

        // --- Initialize price fields before right panel usage ---
        tfCashReceived = new JTextField(12);
        tfChange = new JTextField(12);
        tfChange.setEditable(false);
        tfGrandTotal = new JTextField(14);
        tfGrandTotal.setEditable(false);

        // Add to Order button (full width, prominent)
        gbc.gridy++;
        gbc.insets = new Insets(16, 0, 0, 0);
        leftPanel.add(btnAddToOrder = new JButton("Add to Order"), gbc);
        btnAddToOrder.setFont(new Font("Arial", Font.BOLD, 16));
        btnAddToOrder.setPreferredSize(new Dimension(220, 36));
        btnAddToOrder.setMaximumSize(new Dimension(220, 36));
        btnAddToOrder.setAlignmentX(Component.CENTER_ALIGNMENT);

        // --- Right: Order Table & Actions ---
        JPanel rightPanel = new JPanel();
        rightPanel.setLayout(new BoxLayout(rightPanel, BoxLayout.Y_AXIS));
        rightPanel.setBackground(UIConstants.PANEL_BG);
        rightPanel.setBorder(new EmptyBorder(10, 10, 10, 10));
        JLabel orderLabel = new JLabel("Order Details");
        orderLabel.setFont(new Font("Arial", Font.BOLD, 22));
        orderLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        rightPanel.add(orderLabel);
        rightPanel.add(Box.createVerticalStrut(10));
        orderTableModel = new DefaultTableModel(new String[]{
            "Product Name", "Category", "Quantity", "Unit Price", "Total Price", "Product ID"
        }, 0) {
            @Override
            public boolean isCellEditable(int r, int c) {
                return false;
            }
        };
        orderTable = new JTable(orderTableModel);
        orderTable.getColumnModel().getColumn(5).setMinWidth(0);
        orderTable.getColumnModel().getColumn(5).setMaxWidth(0);
        orderTable.getColumnModel().getColumn(5).setWidth(0);
        orderTable.setRowHeight(32);
        JScrollPane orderScroll = new JScrollPane(orderTable);
        orderScroll.setPreferredSize(new Dimension(600, 320));
        rightPanel.add(orderScroll);
        rightPanel.add(Box.createVerticalStrut(10));
        // --- Price Fields on Right Panel ---
        JPanel pricePanel = new JPanel();
        pricePanel.setLayout(new GridBagLayout());
        pricePanel.setOpaque(false);
        GridBagConstraints pgbc = new GridBagConstraints();
        pgbc.insets = new Insets(8, 8, 8, 8); // More spacing
        pgbc.gridx = 0;
        pgbc.gridy = 0;
        pgbc.anchor = GridBagConstraints.EAST;
        JLabel lblCashReceived = new JLabel("Cash Received:");
        lblCashReceived.setFont(new Font("Arial", Font.BOLD, 16));
        pricePanel.add(lblCashReceived, pgbc);
        pgbc.gridx = 1;
        pgbc.anchor = GridBagConstraints.WEST;
        tfCashReceived.setPreferredSize(new Dimension(140, 32));
        tfCashReceived.setFont(new Font("Arial", Font.BOLD, 16));
        pricePanel.add(tfCashReceived, pgbc);
        pgbc.gridx = 0;
        pgbc.gridy++;
        pgbc.anchor = GridBagConstraints.EAST;
        JLabel lblChange = new JLabel("Change:");
        lblChange.setFont(new Font("Arial", Font.BOLD, 16));
        pricePanel.add(lblChange, pgbc);
        pgbc.gridx = 1;
        pgbc.anchor = GridBagConstraints.WEST;
        tfChange.setPreferredSize(new Dimension(140, 32));
        tfChange.setFont(new Font("Arial", Font.BOLD, 16));
        pricePanel.add(tfChange, pgbc);
        pgbc.gridx = 0;
        pgbc.gridy++;
        pgbc.anchor = GridBagConstraints.EAST;
        JLabel lblGrandTotal = new JLabel("Grand Total:");
        lblGrandTotal.setFont(new Font("Arial", Font.BOLD, 16));
        pricePanel.add(lblGrandTotal, pgbc);
        pgbc.gridx = 1;
        pgbc.anchor = GridBagConstraints.WEST;
        tfGrandTotal.setPreferredSize(new Dimension(140, 32));
        tfGrandTotal.setFont(new Font("Arial", Font.BOLD, 16));
        pricePanel.add(tfGrandTotal, pgbc);
        rightPanel.add(pricePanel);
        rightPanel.add(Box.createVerticalStrut(20));
        // --- Action Buttons (centered, same row as Add to Order) ---
        JPanel btnPanel = new JPanel(new GridBagLayout());
        btnPanel.setOpaque(false);
        GridBagConstraints btnGbc = new GridBagConstraints();
        btnGbc.gridx = 0;
        btnGbc.gridy = 0;
        btnGbc.insets = new Insets(0, 0, 0, 12);
        btnGbc.anchor = GridBagConstraints.CENTER;
        btnRemoveFromOrder = new JButton("Remove Selected");
        btnRemoveFromOrder.setFont(new Font("Arial", Font.BOLD, 16));
        btnRemoveFromOrder.setForeground(new Color(200, 40, 40));
        btnRemoveFromOrder.setPreferredSize(new Dimension(180, 36));
        btnRemoveFromOrder.setMaximumSize(new Dimension(180, 36));
        btnPanel.add(btnRemoveFromOrder, btnGbc);
        btnGbc.gridx++;
        JButton btnComplete = new JButton("Complete Transaction");
        btnComplete.setFont(new Font("Arial", Font.BOLD, 18));
        btnComplete.setPreferredSize(new Dimension(260, 50)); // Expanded for emphasis
        btnComplete.setMaximumSize(new Dimension(260, 50));
        btnPanel.add(btnComplete, btnGbc);
        btnGbc.gridx++;
        JButton btnReset = new JButton("Reset Order");
        btnReset.setFont(new Font("Arial", Font.BOLD, 18));
        btnReset.setPreferredSize(new Dimension(180, 36));
        btnReset.setMaximumSize(new Dimension(180, 36));
        btnPanel.add(btnReset, btnGbc);
        // Center the button panel horizontally
        btnPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
        rightPanel.add(btnPanel);
        rightPanel.add(Box.createVerticalGlue());

        mainPanel.add(leftPanel, BorderLayout.WEST);
        mainPanel.add(rightPanel, BorderLayout.CENTER);
        add(mainPanel, BorderLayout.CENTER);

        // Populate dropdowns
        loadCategories();
        cbCategory.addItemListener(e -> {
            if (e.getStateChange() == ItemEvent.SELECTED) {
                tfProductSearch.setText(""); // Reset product field on category change
                loadProductsByCategory((String) cbCategory.getSelectedItem());
            }
        });
        tfProductSearch.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) {
                updateTotalPrice();
                updateQuantitySpinnerMax();
            }

            public void removeUpdate(javax.swing.event.DocumentEvent e) {
                updateTotalPrice();
                updateQuantitySpinnerMax();
            }

            public void changedUpdate(javax.swing.event.DocumentEvent e) {
                updateTotalPrice();
                updateQuantitySpinnerMax();
            }
        });
        tfCashReceived.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) {
                updateChange();
            }

            public void removeUpdate(javax.swing.event.DocumentEvent e) {
                updateChange();
            }

            public void changedUpdate(javax.swing.event.DocumentEvent e) {
                updateChange();
            }
        });
        spQuantity.addChangeListener(e -> updateTotalPrice());
        btnReset.addActionListener(e -> resetFields(true));

        // Add/Remove order logic
        btnAddToOrder.addActionListener(e -> {
            String txnType = (String) cbTransactionType.getSelectedItem();
            if ("Return".equals(txnType)) {
                JOptionPane.showMessageDialog(this, "You cannot add products to a return. Only products from the original transaction can be returned.", "Not Allowed", JOptionPane.WARNING_MESSAGE);
                return;
            }
            addToOrder();
        });
        btnRemoveFromOrder.addActionListener(e -> removeFromOrder());
        updateGrandTotal();

        // --- Complete Transaction Logic ---
        btnComplete.addActionListener(e -> {
            String txnType = (String) cbTransactionType.getSelectedItem();
            if (orderTableModel.getRowCount() == 0) {
                JOptionPane.showMessageDialog(this, "No products in the order.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            // Gather transaction info
            String buyerName = tfBuyerName.getText().trim();
            if (buyerName.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Buyer's Name cannot be empty.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            // Validate cash received
            BigDecimal grandTotal = new BigDecimal(tfGrandTotal.getText().trim().isEmpty() ? "0" : tfGrandTotal.getText().trim());
            BigDecimal cashReceived = new BigDecimal(tfCashReceived.getText().trim().isEmpty() ? "0" : tfCashReceived.getText().trim());
            if (cashReceived.compareTo(grandTotal) < 0) {
                JOptionPane.showMessageDialog(this, "Cash received must be at least the grand total.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            // Confirm
            int confirm = JOptionPane.showConfirmDialog(this, "Proceed with this transaction?", "Confirm Transaction", JOptionPane.YES_NO_OPTION);
            if (confirm != JOptionPane.YES_OPTION) {
                return;
            }

            String buyerAddress = tfBuyerAddress.getText().trim();
            String buyerContact = tfBuyerContact.getText().trim();
            User user = User.getCurrentUser();
            int sellerId = user != null ? user.getSellerId() : 0;
            String sellerName = user != null ? user.getSellerName() : "";
            java.time.LocalDate txnDate = java.time.LocalDate.now();

            // --- Generate 8-digit numeric receipt number ---
            int receiptNumber = 10000000 + new Random().nextInt(90000000);

            // --- Patch: For Return, get original receipt number and validate ---
            Integer returnForReceiptNumber = null;
            if ("Return".equals(txnType)) {
                String receiptStr = JOptionPane.showInputDialog(this, "Enter receipt number for the return:");
                if (receiptStr == null || receiptStr.trim().isEmpty()) {
                    JOptionPane.showMessageDialog(this, "Return must reference a valid sales receipt.", "Error", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                try {
                    returnForReceiptNumber = Integer.parseInt(receiptStr.trim());
                } catch (Exception ex) {
                    JOptionPane.showMessageDialog(this, "Invalid receipt number.", "Error", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                // Build productId -> returnQty map from the order table
                Map<Integer, Integer> returnQuantities = new HashMap<>();
                for (int i = 0; i < orderTableModel.getRowCount(); i++) {
                    int productId = (int) orderTableModel.getValueAt(i, 5);
                    int qty = Integer.parseInt(orderTableModel.getValueAt(i, 2).toString());
                    returnQuantities.put(productId, qty);
                }
                if (!validateReturnByReceipt(returnForReceiptNumber, returnQuantities)) {
                    return;
                }
            }

            Transaction txn = new Transaction();
            txn.setBuyerName(buyerName);
            txn.setBuyerAddress(buyerAddress);
            txn.setBuyerContact(buyerContact);
            txn.setSellerId(sellerId);
            txn.setSellerName(sellerName);
            txn.setTransactionType(txnType);
            txn.setDeliveryMethod((String) cbDeliveryMethod.getSelectedItem());
            txn.setTransactionDate(txnDate);
            txn.setGrandTotal(grandTotal);
            txn.setReceiptNumber(receiptNumber);
            if ("Return".equals(txnType)) {
                txn.setTransactionStatus("Completed");
                txn.setIsReturned(1);
                txn.setReturnForReceiptNumber(returnForReceiptNumber);
            } else if (txnType.equals("Sale Walk-In") || txnType.equals("Adjustment")) {
                txn.setTransactionStatus("Completed");
                txn.setIsReturned(0);
                txn.setReturnForReceiptNumber(null);
            } else {
                txn.setTransactionStatus("Ongoing");
                txn.setIsReturned(0);
                txn.setReturnForReceiptNumber(null);
            }
            int txnId = TransactionDAO.insertTransaction(txn);
            if (txnId <= 0) {
                JOptionPane.showMessageDialog(this, "Failed to record transaction.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            boolean error = false;
            StringBuilder errorMsg = new StringBuilder();
            List<Integer> insertedItemIds = new java.util.ArrayList<>();
            // Store original product quantities for rollback
            java.util.Map<Integer, Integer> originalQuantities = new java.util.HashMap<>();
            for (int i = 0; i < orderTableModel.getRowCount(); i++) {
                int productId = (int) orderTableModel.getValueAt(i, 5);
                Product product = ProductDAO.getProductById(productId);
                if (product == null) {
                    error = true;
                    errorMsg.append("Product not found: ").append(productId).append("\n");
                    continue;
                }
                int oldQty = product.getQuantity();
                originalQuantities.put(product.getProductId(), oldQty);
                int qty = Integer.parseInt(orderTableModel.getValueAt(i, 2).toString());
                int newQty = oldQty;
                switch (currentTxnType) {
                    case "Restock":
                        newQty = oldQty + qty;
                        break;
                    case "Return":
                        newQty = oldQty + qty;
                        // If product was no-stock, mark as available
                        if (oldQty == 0) {
                            product.setAvailable(true);
                        }
                        break;
                    case "Adjustment":
                        String adj = JOptionPane.showInputDialog(this, "Enter adjustment (use negative for decrease):", product.getQuantity());
                        if (adj == null) {
                            error = true;
                            errorMsg.append("Adjustment cancelled for: ").append(product.getProductName()).append("\n");
                            continue;
                        }
                        try {
                            newQty = Integer.parseInt(adj);
                        } catch (Exception ex) {
                            error = true;
                            errorMsg.append("Invalid adjustment for: ").append(product.getProductName()).append("\n");
                            continue;
                        }
                        break;
                    case "Damage":
                        newQty = oldQty - qty;
                        break;
                    case "Sale Walk-In":
                        newQty = oldQty - qty;
                        break;
                    case "Sale PO":
                    default:
                        newQty = oldQty;
                }
                System.out.println("[DEBUG] Before negative stock check: currentTxnType=" + currentTxnType + ", newQty=" + newQty + ", product=" + product.getProductName());
                if (!"Return".equals(currentTxnType) && newQty < 0) {
                    error = true;
                    errorMsg.append("Negative stock for: ").append(product.getProductName()).append("\n");
                    continue;
                }
                product.setQuantity(newQty);
                if (newQty == 0) {
                    product.setAvailable(false);
                }
                if (!ProductDAO.updateProduct(product)) {
                    error = true;
                    errorMsg.append("Failed to update inventory for: ").append(product.getProductName()).append("\n");
                    continue;
                }
                // Log transaction item
                TransactionItem item = new TransactionItem();
                item.setTransactionId(txnId);
                item.setProductId(product.getProductId());
                item.setProductName(product.getProductName());
                item.setQuantity(qty);
                item.setUnitPrice(product.getUnitPrice());
                item.setTotalPrice(product.getUnitPrice().multiply(java.math.BigDecimal.valueOf(qty)));
                if (!TransactionDAO.insertTransactionItem(item)) {
                    error = true;
                    errorMsg.append("Failed to log item: ").append(product.getProductName()).append("\n");
                } else {
                    insertedItemIds.add(item.getProductId());
                }
            }
            if (error) {
                // Rollback: delete transaction items first, then transaction
                TransactionDAO.deleteTransactionItemsByTransactionId(txnId);
                TransactionDAO.deleteTransaction(txnId);
                // Restore product quantities
                for (java.util.Map.Entry<Integer, Integer> entry : originalQuantities.entrySet()) {
                    Product prod = ProductDAO.getProductById(entry.getKey());
                    if (prod != null) {
                        prod.setQuantity(entry.getValue());
                        ProductDAO.updateProduct(prod);
                    }
                }
                JOptionPane.showMessageDialog(this, "Transaction failed and was rolled back.\n" + errorMsg, "Error", JOptionPane.ERROR_MESSAGE);
            } else {
                // Set status to Completed after all items are inserted and inventory updated (for walk-in/return/adj only)
                if (currentTxnType.equals("Sale Walk-In") || currentTxnType.equals("Return") || currentTxnType.equals("Adjustment")) {
                    txn.setTransactionStatus("Completed");
                }
                // --- Audit log for completed transaction ---
                hardwarehub_main.model.User auditUser = hardwarehub_main.model.User.getCurrentUser();
                int auditSellerId = auditUser != null ? auditUser.getSellerId() : 0;
                java.time.LocalDateTime auditNow = java.time.LocalDateTime.now();
                String auditDetails = String.format("Transaction Type: %s | Receipt: %08d | Buyer: %s | Grand Total: %s", currentTxnType, txn.getReceiptNumber(), buyerName, grandTotal.toPlainString());
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, auditSellerId, auditNow, true, "POSPanel", "Complete Transaction", auditDetails));
                JOptionPane.showMessageDialog(this, "Transaction completed successfully!", "Success", JOptionPane.INFORMATION_MESSAGE);
                // Generate and open receipt for sales/returns only
                if (currentTxnType.equals("Sale Walk-In") || currentTxnType.equals("Sale PO") || currentTxnType.equals("Return")) {
                    List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txnId);
                    JFrame parentFrame = (JFrame) SwingUtilities.getWindowAncestor(this);
                    java.io.File receipt = hardwarehub_main.gui.pos.ReceiptGenerator.generateReceipt(txn, items, user, parentFrame);
                    if (receipt != null && receipt.exists()) {
                        try {
                            java.awt.Desktop.getDesktop().open(receipt);
                        } catch (Exception ex) {
                            /* ignore */ }
                    }
                }
                resetFields(true);
            }
        });

        // Smart product search suggestion window logic
        productSuggestionWindow = new JWindow(SwingUtilities.getWindowAncestor(this));
        suggestionList = new JList<>();
        suggestionList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        suggestionList.setFont(new Font("Arial", Font.PLAIN, 15));
        suggestionList.setFocusable(false);
        JScrollPane scrollPane = new JScrollPane(suggestionList);
        productSuggestionWindow.getContentPane().add(scrollPane);
        productSuggestionWindow.setSize(300, 180);
        productSuggestionWindow.setFocusableWindowState(false);

        tfProductSearch.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) {
                showProductSuggestions();
            }

            public void removeUpdate(javax.swing.event.DocumentEvent e) {
                showProductSuggestions();
            }

            public void changedUpdate(javax.swing.event.DocumentEvent e) {
                showProductSuggestions();
            }
        });
        tfProductSearch.addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (productSuggestionWindow.isVisible()) {
                    if (e.getKeyCode() == KeyEvent.VK_DOWN) {
                        int idx = suggestionList.getSelectedIndex();
                        if (idx < suggestionList.getModel().getSize() - 1) {
                            suggestionList.setSelectedIndex(idx + 1);
                            suggestionList.ensureIndexIsVisible(idx + 1);
                        }
                        e.consume();
                    } else if (e.getKeyCode() == KeyEvent.VK_UP) {
                        int idx = suggestionList.getSelectedIndex();
                        if (idx > 0) {
                            suggestionList.setSelectedIndex(idx - 1);
                            suggestionList.ensureIndexIsVisible(idx - 1);
                        }
                        e.consume();
                    } else if (e.getKeyCode() == KeyEvent.VK_TAB || e.getKeyCode() == KeyEvent.VK_ENTER) {
                        int idx = suggestionList.getSelectedIndex();
                        if (idx >= 0 && idx < suggestionList.getModel().getSize()) {
                            String selected = suggestionList.getModel().getElementAt(idx);
                            tfProductSearch.setText(selected);
                            tfProductSearch.setCaretPosition(selected.length());
                            System.out.println("Hiding window: suggestion chosen via key");
                            productSuggestionWindow.setVisible(false);
                            updateTotalPrice();
                            e.consume();
                        }
                    } else if (e.getKeyCode() == KeyEvent.VK_ESCAPE) {
                        productSuggestionWindow.setVisible(false);
                        e.consume();
                    }
                }
            }
        });
        tfProductSearch.addFocusListener(new java.awt.event.FocusAdapter() {
            @Override
            public void focusLost(java.awt.event.FocusEvent e) {
                // Hide only if focus is not in the suggestion window
                if (productSuggestionWindow.isVisible()) {
                    Component opposite = e.getOppositeComponent();
                    if (opposite != null && SwingUtilities.isDescendingFrom(opposite, productSuggestionWindow)) {
                        return;
                    }
                }
                System.out.println("Hiding window: focus lost");
                productSuggestionWindow.setVisible(false);
            }
        });
        suggestionList.addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseClicked(java.awt.event.MouseEvent e) {
                int idx = suggestionList.locationToIndex(e.getPoint());
                if (idx >= 0) {
                    String selected = suggestionList.getModel().getElementAt(idx);
                    tfProductSearch.setText(selected);
                    tfProductSearch.setCaretPosition(selected.length());
                    System.out.println("Hiding window: suggestion chosen via mouse");
                    productSuggestionWindow.setVisible(false);
                    updateTotalPrice();
                }
            }
        });

        cbTransactionType.addItemListener(e -> {
            if (isProgrammaticComboChange) return;
            if (e.getStateChange() == ItemEvent.SELECTED) {
                String txnType = (String) cbTransactionType.getSelectedItem();
                System.out.println("ComboBox changed, txnType: " + txnType);
                currentTxnType = txnType;
                // Always reset on type switch, but do NOT reset combo box selection
                resetFields(false); // pass false to not reset combo box
                if ("Return".equals(txnType)) {
                    btnAddToOrder.setEnabled(false);
                    // Prompt for receipt number when switching to return
                    String receiptStr = JOptionPane.showInputDialog(this, "Enter receipt number for the return:");
                    if (receiptStr == null || receiptStr.trim().isEmpty()) {
                        isProgrammaticComboChange = true;
                        cbTransactionType.setSelectedIndex(0); // Only reset if user cancels
                        isProgrammaticComboChange = false;
                        btnAddToOrder.setEnabled(true);
                        return;
                    }
                    int receiptNum = -1;
                    try {
                        receiptNum = Integer.parseInt(receiptStr.trim());
                    } catch (Exception ex) {
                        JOptionPane.showMessageDialog(this, "Invalid receipt number.", "Error", JOptionPane.ERROR_MESSAGE);
                        btnAddToOrder.setEnabled(true);
                        return;
                    }
                    if (receiptNum < 0) {
                        JOptionPane.showMessageDialog(this, "Invalid receipt number.", "Error", JOptionPane.ERROR_MESSAGE);
                        btnAddToOrder.setEnabled(true);
                        return;
                    }
                    Transaction txn = TransactionDAO.getTransactionByReceiptNumber(receiptNum);
                    if (txn == null) {
                        JOptionPane.showMessageDialog(this, "No transaction found for this receipt number.", "Error", JOptionPane.ERROR_MESSAGE);
                        btnAddToOrder.setEnabled(true);
                        return;
                    }
                    // Prevent returns from returns and already returned sales
                    if ("Return".equalsIgnoreCase(txn.getTransactionType())) {
                        JOptionPane.showMessageDialog(this, "You cannot return a transaction that is itself a return.", "Error", JOptionPane.ERROR_MESSAGE);
                        btnAddToOrder.setEnabled(true);
                        return;
                    }
                    if (txn.getIsReturned() == 1) {
                        JOptionPane.showMessageDialog(this, "This sale has already been returned and cannot be returned again.", "Return Error", JOptionPane.ERROR_MESSAGE);
                        btnAddToOrder.setEnabled(true);
                        return;
                    }
                    if (!"Sale Walk-In".equals(txn.getTransactionType()) && !"Sale PO".equals(txn.getTransactionType())) {
                        JOptionPane.showMessageDialog(this, "Only original sales receipts can be used for returns.", "Return Error", JOptionPane.ERROR_MESSAGE);
                        btnAddToOrder.setEnabled(true);
                        return;
                    }
                    // If everything is valid, you can optionally load the products from the sale into the order table here.
                    List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
                    orderTableModel.setRowCount(0);
                    for (TransactionItem item : items) {
                        orderTableModel.addRow(new Object[]{
                            item.getProductName(),
                            ProductDAO.getProductById(item.getProductId()).getCategory(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getTotalPrice(),
                            item.getProductId()
                        });
                    }
                    tfBuyerName.setText(txn.getBuyerName());
                    tfBuyerContact.setText(txn.getBuyerContact());
                    tfBuyerAddress.setText(txn.getBuyerAddress());
                    cbDeliveryMethod.setSelectedItem(txn.getDeliveryMethod());
                    updateGrandTotal();
                } else if ("Restock".equals(txnType)) {
                    btnAddToOrder.setEnabled(true);
                    spQuantity.setEnabled(true);
                } else {
                    btnAddToOrder.setEnabled(true);
                }
            }
        });
    }

    private boolean validateReturnByReceipt(int inputReceiptNumber, Map<Integer, Integer> returnQuantities) {
        Transaction originalTxn = TransactionDAO.getTransactionByReceiptNumber(inputReceiptNumber);
        if (originalTxn == null) {
            JOptionPane.showMessageDialog(this,
                    "Receipt not found. Please enter a valid receipt number from a completed sale.",
                    "Return Error", JOptionPane.ERROR_MESSAGE);
            return false;
        }
        // Block using a receipt from a transaction that is itself a return or already marked as a return
        if (originalTxn.getIsReturned() == 1) {
            JOptionPane.showMessageDialog(this,
                    "This sale has already been returned and cannot be returned again.",
                    "Return Error", JOptionPane.ERROR_MESSAGE);
            return false;
        }
        // Block using a receipt that is not a sale
        if (!("Sale Walk-In".equals(originalTxn.getTransactionType()) || "Sale PO".equals(originalTxn.getTransactionType()))) {
            JOptionPane.showMessageDialog(this,
                    "Only original sales receipts can be used for returns.",
                    "Return Error", JOptionPane.ERROR_MESSAGE);
            return false;
        }
        // For each product, check cumulative previous returns for this receipt
        List<TransactionItem> saleItems = TransactionDAO.getTransactionItemsByTransactionId(originalTxn.getTransactionId());
        for (TransactionItem saleItem : saleItems) {
            int productId = saleItem.getProductId();
            int soldQty = saleItem.getQuantity();
            int requestedReturnQty = returnQuantities.getOrDefault(productId, 0);
            if (requestedReturnQty == 0) {
                continue; // Not returning this product
            }
            // Sum all previous returns for this product and this receipt
            int alreadyReturned = 0;
            List<Transaction> allTxns = TransactionDAO.getAllTransactions();
            for (Transaction txn : allTxns) {
                if (!"Return".equalsIgnoreCase(txn.getTransactionType())) {
                    continue;
                }
                if (txn.getIsReturned() != 1) {
                    continue;
                }
                if (txn.getReturnForReceiptNumber() == null) {
                    continue;
                }
                if (txn.getReturnForReceiptNumber().intValue() == inputReceiptNumber) {
                    List<TransactionItem> retItems = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
                    for (TransactionItem retItem : retItems) {
                        if (retItem.getProductId() == productId) {
                            alreadyReturned += retItem.getQuantity();
                        }
                    }
                }
            }
            int maxReturnable = soldQty - alreadyReturned;
            if (requestedReturnQty > maxReturnable) {
                JOptionPane.showMessageDialog(this,
                        "Cannot return more than the remaining unreturned quantity for " + saleItem.getProductName()
                        + ". Sold: " + soldQty + ", Already returned: " + alreadyReturned + ", Attempted return: " + requestedReturnQty,
                        "Return Error", JOptionPane.ERROR_MESSAGE);
                return false;
            }
        }
        return true;
    }

    private JToolBar createRibbon() {
        JToolBar ribbon = new JToolBar();
        ribbon.setFloatable(false);
        ribbon.setBackground(UIConstants.PANEL_BG);
        ribbon.setPreferredSize(new Dimension(0, UIConstants.RIBBON_HEIGHT));
        ribbon.setMinimumSize(new Dimension(0, UIConstants.RIBBON_HEIGHT));
        ribbon.setMaximumSize(new Dimension(Integer.MAX_VALUE, UIConstants.RIBBON_HEIGHT));
        ribbon.add(createAction("Back", "BackButton.png", e -> onBack()));
        ribbon.addSeparator(new Dimension(20, 0));
        ribbon.add(createAction("Refresh", "POS/ReloadOrderButton.png", e -> resetFields(true)));
        ribbon.addSeparator(new Dimension(20, 0));
        ribbon.add(createAction("Help", "POS/AboutIconButton.png", e -> onHelp()));
        return ribbon;
    }

    private String getKeyShortcutText(String action) {
        return switch (action) {
            case "Back" ->
                "Alt+Left";
            case "Refresh" ->
                "Ctrl+R";
            case "Help" ->
                "Ctrl+H";
            default ->
                "";
        };
    }

    private JButton createAction(String text, String iconPath, java.awt.event.ActionListener listener) {
        ImageIcon rawIcon = IconUtil.loadIcon(iconPath);
        Image scaledImg = rawIcon.getImage().getScaledInstance(32, 32, Image.SCALE_SMOOTH);
        ImageIcon icon = new ImageIcon(scaledImg);
        JButton btn = new JButton("<html><center>" + text + "</center></html>", icon);
        btn.setHorizontalTextPosition(SwingConstants.CENTER);
        btn.setVerticalTextPosition(SwingConstants.BOTTOM);
        btn.setPreferredSize(new Dimension(80, 70));
        btn.setBackground(UIConstants.BUTTON_BG);
        btn.setFocusable(false);
        String shortcut = getKeyShortcutText(text);
        btn.setToolTipText(shortcut.isEmpty() ? text : text + " (" + shortcut + ")");
        btn.addActionListener(listener);
        return btn;
    }

    private void loadCategories() {
        cbCategory.removeAllItems();
        List<Category> categories = CategoryDAO.getAllCategories();
        java.util.Map<Integer, java.util.List<Category>> childrenMap = new java.util.HashMap<>();
        java.util.Map<Integer, Category> idToCategory = new java.util.HashMap<>();
        for (Category c : categories) {
            idToCategory.put(c.getCategoryId(), c);
            if (c.getParentCategoryId() != null) {
                childrenMap.computeIfAbsent(c.getParentCategoryId(), k -> new java.util.ArrayList<>()).add(c);
            }
        }
        java.util.List<String> displayNames = new java.util.ArrayList<>();
        java.util.Map<String, Integer> displayNameToId = new java.util.HashMap<>();
        java.util.Map<String, Boolean> selectableMap = new java.util.HashMap<>();
        buildIndentedCategoryDisplayNames(null, 0, categories, childrenMap, displayNames, displayNameToId, selectableMap);
        javax.swing.DefaultComboBoxModel<String> model = new javax.swing.DefaultComboBoxModel<>();
        for (String name : displayNames) {
            model.addElement(name);
        }
        cbCategory.setModel(model);
        cbCategory.setRenderer(new javax.swing.plaf.basic.BasicComboBoxRenderer() {
            @Override
            public java.awt.Component getListCellRendererComponent(javax.swing.JList<?> list, Object value, int index, boolean isSelected, boolean cellHasFocus) {
                java.awt.Component c = super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus);
                String cat = value != null ? value.toString() : null;
                if (cat != null && !selectableMap.getOrDefault(cat, true)) {
                    c.setForeground(java.awt.Color.GRAY);
                } else {
                    c.setForeground(java.awt.Color.BLACK);
                }
                return c;
            }
        });
        cbCategory.putClientProperty("displayNameToId", displayNameToId);
        cbCategory.addActionListener(e -> {
            String selected = (String) cbCategory.getSelectedItem();
            if (selected != null && !selectableMap.getOrDefault(selected, true)) {
                for (int i = 0; i < cbCategory.getItemCount(); i++) {
                    String cat = cbCategory.getItemAt(i);
                    if (selectableMap.getOrDefault(cat, true)) {
                        cbCategory.setSelectedIndex(i);
                        break;
                    }
                }
            }
        });
        for (int i = 0; i < cbCategory.getItemCount(); i++) {
            String cat = cbCategory.getItemAt(i);
            if (selectableMap.getOrDefault(cat, true)) {
                cbCategory.setSelectedIndex(i);
                break;
            }
        }
        if (cbCategory.getItemCount() > 0) {
            loadProductsByCategory((String) cbCategory.getSelectedItem());
        }
    }

    // Helper method for indented category names
    private void buildIndentedCategoryDisplayNames(Integer parentId, int depth, List<Category> categories, java.util.Map<Integer, java.util.List<Category>> childrenMap, java.util.List<String> displayNames, java.util.Map<String, Integer> displayNameToId, java.util.Map<String, Boolean> selectableMap) {
        for (Category c : categories) {
            if ((parentId == null && c.getParentCategoryId() == null) || (parentId != null && parentId.equals(c.getParentCategoryId()))) {
                if (!c.isAvailable()) {
                    continue;
                }
                String indent = "";
                for (int i = 0; i < depth; i++) {
                    indent += "    ";
                }
                String display = indent + c.getCategory();
                displayNames.add(display);
                displayNameToId.put(display, c.getCategoryId());
                boolean isParent = childrenMap.containsKey(c.getCategoryId());
                selectableMap.put(display, !isParent);
                if (isParent) {
                    buildIndentedCategoryDisplayNames(c.getCategoryId(), depth + 1, categories, childrenMap, displayNames, displayNameToId, selectableMap);
                }
            }
        }
    }

    private void loadProductsByCategory(String displayCategory) {
        List<Category> categories = CategoryDAO.getAllCategories();
        java.util.Map<Integer, Category> idToCategory = new java.util.HashMap<>();
        for (Category c : categories) {
            idToCategory.put(c.getCategoryId(), c);
        }
        @SuppressWarnings("unchecked")
        java.util.Map<String, Integer> displayNameToId = (java.util.Map<String, Integer>) cbCategory.getClientProperty("displayNameToId");
        Integer categoryId = displayNameToId != null ? displayNameToId.get(displayCategory) : null;
        if (categoryId == null) {
            return;
        }
        String txnType = (String) cbTransactionType.getSelectedItem();
        List<Product> products = ProductDAO.getAllProducts().stream()
                .filter(p -> {
                    if ("Restock".equals(txnType)) {
                        return p.getCategoryId() == categoryId; // include unavailable
                    }
                    return p.isAvailable() && p.getCategoryId() == categoryId;
                })
                .filter(p -> {
                    Category cat = idToCategory.get(p.getCategoryId());
                    return cat != null && cat.isAvailable();
                })
                .filter(p -> {
                    hardwarehub_main.model.Supplier sup = hardwarehub_main.dao.SupplierDAO.getSupplierById(p.getSupplierId());
                    return sup != null && sup.isAvailable();
                })
                .toList();
        java.util.List<String> productSuggestions = new java.util.ArrayList<>();
        java.util.Map<String, Product> displayToProduct = new java.util.HashMap<>();
        for (Product p : products) {
            String display = p.getProductName() + " (" + p.getSupplierName() + ") [" + p.getQuantity();
            if (p.getQuantity() == 0) {
                display += ", NO STOCK";
            } else if (p.getQuantity() <= p.getMinThreshold()) {
                display += ", LOW";
            }
            if (!p.isAvailable()) {
                display += ", UNAVAILABLE";
            }
            display += "]";
            productSuggestions.add(display);
            displayToProduct.put(display, p);
        }
        tfProductSearch.putClientProperty("productSuggestions", productSuggestions);
        tfProductSearch.putClientProperty("displayToProduct", displayToProduct);
        checkLowStock(products);
        updateTotalPrice();
    }

    // System-wide alert for low/no stock
    private void checkLowStock(List<Product> products) {
        StringBuilder warn = new StringBuilder();
        boolean logged = false;
        for (Product p : products) {
            if (p.getQuantity() == 0) {
                warn.append("[NO STOCK] ").append(p.getProductName()).append("\n");
                // Log to audit log
                if (!logged) {
                    hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                    int sellerId = user != null ? user.getSellerId() : 0;
                    java.time.LocalDateTime now = java.time.LocalDateTime.now();
                    String details = "NO STOCK: " + p.getProductName();
                    hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "POSPanel", "Stock Alert", details));
                    logged = true;
                }
            } else if (p.getQuantity() <= p.getMinThreshold()) {
                warn.append("[LOW STOCK] ").append(p.getProductName())
                        .append(" (" + p.getQuantity() + "/min " + p.getMinThreshold() + ")\n");
                // Log to audit log
                if (!logged) {
                    hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                    int sellerId = user != null ? user.getSellerId() : 0;
                    java.time.LocalDateTime now = java.time.LocalDateTime.now();
                    String details = "LOW STOCK: " + p.getProductName() + " (" + p.getQuantity() + "/min " + p.getMinThreshold() + ")";
                    hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "POSPanel", "Stock Alert", details));
                    logged = true;
                }
            }
        }
        if (warn.length() > 0) {
            JOptionPane.showMessageDialog(this, warn.toString(), "Stock Warnings", JOptionPane.WARNING_MESSAGE);
        }
    }

    private void updateTotalPrice() {
        try {
            String prodDisplay = tfProductSearch.getText().trim();
            if (prodDisplay.isEmpty()) {
                tfTotalPrice.setText("");
                return;
            }
            @SuppressWarnings("unchecked")
            java.util.Map<String, Product> displayToProduct = (java.util.Map<String, Product>) tfProductSearch.getClientProperty("displayToProduct");
            Product p = displayToProduct != null ? displayToProduct.get(prodDisplay) : null;
            if (p == null) {
                tfTotalPrice.setText("");
                return;
            }
            int qty = (int) spQuantity.getValue();
            String txnType = (String) cbTransactionType.getSelectedItem();
            if ("Restock".equals(txnType) && !p.isAvailable()) {
                tfTotalPrice.setText("N/A");
                return;
            }
            java.math.BigDecimal total = p.getUnitPrice().multiply(java.math.BigDecimal.valueOf(qty));
            tfTotalPrice.setText(total.toPlainString());
        } catch (Exception ex) {
            tfTotalPrice.setText("");
        }
        updateChange();
    }

    private void updateChange() {
        try {
            BigDecimal grandTotal = new BigDecimal(tfGrandTotal.getText().trim());
            BigDecimal cash = new BigDecimal(tfCashReceived.getText().trim());
            BigDecimal change = cash.subtract(grandTotal);
            tfChange.setText(change.compareTo(BigDecimal.ZERO) >= 0 ? change.toPlainString() : "");
        } catch (Exception ex) {
            tfChange.setText("");
        }
    }

    private void resetFields(boolean resetComboBox) {
        if (resetComboBox) {
            isProgrammaticComboChange = true;
            cbTransactionType.setSelectedIndex(0);
            isProgrammaticComboChange = false;
        }
        loadCategories();
        spQuantity.setValue(1);
        tfBuyerName.setText("");
        tfBuyerContact.setText("");
        tfBuyerAddress.setText("");
        cbDeliveryMethod.setSelectedIndex(0);
        tfTotalPrice.setText("");
        tfCashReceived.setText("");
        tfChange.setText("");
        orderTableModel.setRowCount(0);
        updateGrandTotal();
        tfProductSearch.setText("");
        updateQuantitySpinnerMax();
    }

    private void onBack() {
        java.awt.Window window = SwingUtilities.getWindowAncestor(this);
        if (window instanceof JFrame) {
            JFrame frame = (JFrame) window;
            frame.setCursor(Cursor.getPredefinedCursor(Cursor.WAIT_CURSOR));
            javax.swing.SwingUtilities.invokeLater(() -> {
                javax.swing.SwingUtilities.invokeLater(() -> {
                    SwingWorker<Void, Void> worker = new SwingWorker<>() {
                        @Override
                        protected Void doInBackground() {
                            try {
                                Thread.sleep(700);
                            } catch (InterruptedException ignored) {
                            }
                            return null;
                        }

                        @Override
                        protected void done() {
                            hardwarehub_main.gui.dashboard.DashboardPanel dash = new hardwarehub_main.gui.dashboard.DashboardPanel(frame);
                            frame.setJMenuBar(null);
                            frame.setContentPane(dash);
                            frame.revalidate();
                            frame.repaint();
                            frame.setCursor(Cursor.getDefaultCursor());
                        }
                    };
                    worker.execute();
                });
            });
        }
    }

    private void onHelp() {
        StringBuilder sb = new StringBuilder();
        sb.append("POINT OF SALE (POS) PANEL HELP\n\n");
        sb.append("Purpose:\n");
        sb.append("- Process sales, returns, and adjustments at the point of sale.\n\n");
        sb.append("Main Processes:\n");
        sb.append("- Select transaction type (Sale Walk-In, Sale PO, Return, Adjustment).\n");
        sb.append("- Add products to the order, enter quantities, and buyer information.\n");
        sb.append("- Complete transaction and print receipt.\n");
        sb.append("- Edit previous transactions.\n");
        sb.append("- View and manage order details, payment, and change.\n\n");
        sb.append("Ribbon & Menu Bar Buttons:\n");
        sb.append("- Back: Return to dashboard.\n");
        sb.append("- Refresh: Reset all fields and start a new transaction.\n");
        sb.append("- Help: Show this help dialog.\n\n");
        sb.append("Keyboard Shortcuts:\n");
        sb.append("- Back: Alt+Left\n");
        sb.append("- Refresh: Ctrl+R\n");
        sb.append("- Help: Ctrl+H\n");
        sb.append("- Exit: Escape\n\n");
        sb.append("Developed by: JCBP Solutions © 2025\nHardwareHub v1.0");
        JOptionPane.showMessageDialog(this, sb.toString(), "POS Help", JOptionPane.INFORMATION_MESSAGE);
    }

    private void onEditTransaction() {
        // Show a dialog to select a previous transaction
        List<Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        String[] txnChoices = txns.stream()
                .map(t -> t.getTransactionId() + ": " + t.getBuyerName() + " (" + t.getTransactionType() + ", " + t.getTransactionDate() + ")")
                .toArray(String[]::new);
        String selected = (String) JOptionPane.showInputDialog(this, "Select transaction to edit:", "Edit Transaction", JOptionPane.PLAIN_MESSAGE, null, txnChoices, null);
        if (selected == null) {
            return;
        }
        int txnId = Integer.parseInt(selected.split(":")[0]);
        Transaction txn = hardwarehub_main.dao.TransactionDAO.getTransactionById(txnId);
        if (txn == null) {
            JOptionPane.showMessageDialog(this, "Transaction not found.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        if (!"Ongoing".equalsIgnoreCase(txn.getTransactionStatus())) {
            JOptionPane.showMessageDialog(this, "Only ongoing transactions can be edited.", "Edit Not Allowed", JOptionPane.WARNING_MESSAGE);
            return;
        }
        List<hardwarehub_main.model.TransactionItem> items = hardwarehub_main.dao.TransactionDAO.getTransactionItemsByTransactionId(txnId);
        txn.getTransactionItems().clear();
        txn.getTransactionItems().addAll(items);
        hardwarehub_main.gui.transaction.EditTransactionDialog dialog = new hardwarehub_main.gui.transaction.EditTransactionDialog(SwingUtilities.getWindowAncestor(this), txn);
        dialog.setVisible(true);
        if (dialog.isUpdated()) {
            // Save changes to DB
            hardwarehub_main.dao.TransactionDAO.updateTransaction(txn);
            hardwarehub_main.dao.TransactionDAO.deleteTransactionItemsByTransactionId(txnId);
            for (hardwarehub_main.model.TransactionItem item : txn.getTransactionItems()) {
                item.setTransactionId(txnId);
                hardwarehub_main.dao.TransactionDAO.insertTransactionItem(item);
            }
            JOptionPane.showMessageDialog(this, "Transaction updated.");
        }
    }

    // Add product to order table
    private void addToOrder() {
        String prodDisplay = tfProductSearch.getText().trim();
        if (prodDisplay.isEmpty()) {
            return;
        }
        @SuppressWarnings("unchecked")
        java.util.Map<String, Product> displayToProduct = (java.util.Map<String, Product>) tfProductSearch.getClientProperty("displayToProduct");
        Product p = displayToProduct != null ? displayToProduct.get(prodDisplay) : null;
        if (p == null) {
            return;
        }
        int qty = (int) spQuantity.getValue();
        if (qty <= 0) {
            return;
        }
        BigDecimal total = p.getUnitPrice().multiply(BigDecimal.valueOf(qty));
        orderTableModel.addRow(new Object[]{p.getProductName(), p.getCategory(), qty, p.getUnitPrice(), total, p.getProductId()});
        updateGrandTotal();
        updateQuantitySpinnerMax();
    }

    // Remove selected product from order table
    private void removeFromOrder() {
        int row = orderTable.getSelectedRow();
        if (row >= 0) {
            orderTableModel.removeRow(row);
        }
        updateGrandTotal();
    }

    // Update grand total field
    private void updateGrandTotal() {
        BigDecimal grandTotal = BigDecimal.ZERO;
        for (int i = 0; i < orderTableModel.getRowCount(); i++) {
            Object val = orderTableModel.getValueAt(i, 4); // Total Price column
            if (val instanceof BigDecimal) {
                grandTotal = grandTotal.add((BigDecimal) val);
            } else if (val != null) {
                try {
                    grandTotal = grandTotal.add(new BigDecimal(val.toString()));
                } catch (Exception ignored) {
                }
            }
        }
        tfGrandTotal.setText(grandTotal.toPlainString());
    }

    // --- Menu Bar ---
    public JMenuBar createMenuBar() {
        JMenuBar menuBar = new JMenuBar();

        // File menu
        JMenu fileMenu = new JMenu("File");
        fileMenu.add(createMenuItem("Back", KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, KeyEvent.ALT_DOWN_MASK), e -> onBack()));
        menuBar.add(fileMenu);

        // View menu
        JMenu viewMenu = new JMenu("View");
        viewMenu.add(createMenuItem("Refresh", KeyStroke.getKeyStroke(KeyEvent.VK_R, KeyEvent.CTRL_DOWN_MASK), e -> resetFields(true)));
        menuBar.add(viewMenu);

        // Help menu
        JMenu helpMenu = new JMenu("Help");
        helpMenu.add(createMenuItem("Help", KeyStroke.getKeyStroke(KeyEvent.VK_H, KeyEvent.CTRL_DOWN_MASK), e -> onHelp()));
        menuBar.add(helpMenu);

        return menuBar;
    }

    private JMenuItem createMenuItem(String text, KeyStroke shortcut, java.awt.event.ActionListener action) {
        JMenuItem item = new JMenuItem(text);
        item.setAccelerator(shortcut);
        item.addActionListener(action);
        return item;
    }

    // --- Key Bindings ---
    public void registerKeyBindings(JRootPane rootPane) {
        bindKey(rootPane, "back", KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, KeyEvent.ALT_DOWN_MASK), e -> onBack());
        bindKey(rootPane, "refresh", KeyStroke.getKeyStroke(KeyEvent.VK_R, KeyEvent.CTRL_DOWN_MASK), e -> resetFields(true));
        bindKey(rootPane, "help", KeyStroke.getKeyStroke(KeyEvent.VK_H, KeyEvent.CTRL_DOWN_MASK), e -> onHelp());
        // Esc to close dialog (if inside a dialog)
        bindEscapeKeyToClose(rootPane);
    }

    private void bindKey(JRootPane root, String name, KeyStroke keyStroke, java.awt.event.ActionListener action) {
        root.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(keyStroke, name);
        root.getActionMap().put(name, new AbstractAction() {
            public void actionPerformed(ActionEvent e) {
                action.actionPerformed(e);
            }
        });
    }

    private void bindEscapeKeyToClose(JRootPane rootPane) {
        KeyStroke escapeKeyStroke = KeyStroke.getKeyStroke("ESCAPE");
        String dispatchWindowClosingActionMapKey = "com.spotlight.CloseDialogOnEscape";
        rootPane.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW)
                .put(escapeKeyStroke, dispatchWindowClosingActionMapKey);
        rootPane.getActionMap().put(dispatchWindowClosingActionMapKey, new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                // Try to close the top-level dialog if present
                Container c = rootPane.getParent();
                while (c != null && !(c instanceof JDialog)) {
                    c = c.getParent();
                }
                if (c instanceof JDialog dialog) {
                    dialog.dispose();
                }
            }
        });
    }

    // Helper to make left-aligned label
    private JLabel makeLabel(String text) {
        JLabel lbl = new JLabel(text);
        lbl.setFont(new Font("Arial", Font.PLAIN, 15));
        lbl.setHorizontalAlignment(SwingConstants.LEFT);
        lbl.setPreferredSize(new Dimension(220, 20));
        return lbl;
    }

    private void showProductSuggestions() {
        String input = tfProductSearch.getText().trim().toLowerCase();
        @SuppressWarnings("unchecked")
        java.util.Map<String, Product> displayToProduct = (java.util.Map<String, Product>) tfProductSearch.getClientProperty("displayToProduct");
        System.out.println("showProductSuggestions: input='" + input + "', displayToProduct size: " + (displayToProduct != null ? displayToProduct.size() : "null"));
        if (displayToProduct == null) {
            return;
        }
        java.util.List<String> allSuggestions = new java.util.ArrayList<>(displayToProduct.keySet());
        if (input.isEmpty()) {
            System.out.println("Hiding window: input is empty");
            productSuggestionWindow.setVisible(false);
            return;
        }
        java.util.List<String> filtered = allSuggestions.stream()
                .filter(s -> fuzzyMatch(s.toLowerCase(), input))
                .limit(10)
                .toList();
        System.out.println("Filtered suggestions: " + filtered.size());
        currentProductSuggestions = filtered;
        if (filtered.isEmpty()) {
            System.out.println("Hiding window: no filtered suggestions");
            productSuggestionWindow.setVisible(false);
            return;
        }
        suggestionList.setListData(filtered.toArray(new String[0]));
        suggestionList.setSelectedIndex(0);
        // Position the window below the text field
        try {
            Point location = tfProductSearch.getLocationOnScreen();
            productSuggestionWindow.setLocation(location.x, location.y + tfProductSearch.getHeight());
        } catch (Exception ex) {
            productSuggestionWindow.setLocation(100, 100);
        }
        productSuggestionWindow.setVisible(true);
        System.out.println("Showing window with " + filtered.size() + " suggestions");
    }

    // Simple fuzzy match: contains all chars in order, or Levenshtein distance <= 2
    private boolean fuzzyMatch(String text, String input) {
        if (input.isEmpty()) {
            return true;
        }
        if (text.contains(input)) {
            return true;
        }
        // Levenshtein distance
        return levenshtein(text, input) <= 2;
    }

    private int levenshtein(String a, String b) {
        int[] costs = new int[b.length() + 1];
        for (int j = 0; j < costs.length; j++) {
            costs[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= b.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]), a.charAt(i - 1) == b.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[b.length()];
    }

    // Helper to update spinner max
    private void updateQuantitySpinnerMax() {
        @SuppressWarnings("unchecked")
        java.util.Map<String, Product> displayToProduct = (java.util.Map<String, Product>) tfProductSearch.getClientProperty("displayToProduct");
        String prodDisplay = tfProductSearch.getText().trim();
        Product p = displayToProduct != null ? displayToProduct.get(prodDisplay) : null;
        if (p != null) {
            int max = Math.max(1, p.getQuantity());
            SpinnerNumberModel model = (SpinnerNumberModel) spQuantity.getModel();
            model.setMaximum(max);
            if ((int) spQuantity.getValue() > max) {
                spQuantity.setValue(max);
            }
        }
    }

    public static void main(String[] args) {
        // Ensure UI creation on EDT
        SwingUtilities.invokeLater(() -> {
            SubstanceCortex.GlobalScope.setSkin(new BusinessBlueSteelSkin());

            // Create frame
            JFrame frame = new JFrame("HardwareHub POS");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(1650, 1000);
            frame.setLocationRelativeTo(null);

            // Optionally set app icon
            ImageIcon logo = IconUtil.loadIcon("HardwareHub_Icon.png");
            frame.setIconImage(logo.getImage());

            // Create and add POSPanel
            POSPanel panel = new POSPanel();
            frame.setJMenuBar(panel.createMenuBar());
            frame.setContentPane(panel);
            panel.registerKeyBindings(frame.getRootPane());
            frame.revalidate();
            frame.repaint();
        });
    }
}