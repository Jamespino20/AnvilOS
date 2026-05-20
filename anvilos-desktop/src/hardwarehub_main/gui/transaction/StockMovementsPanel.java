package hardwarehub_main.gui.transaction;

import hardwarehub_main.dao.TransactionDAO;
import hardwarehub_main.model.Transaction;
import hardwarehub_main.model.TransactionItem;
import hardwarehub_main.util.IconUtil;
import hardwarehub_main.util.UIConstants;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableRowSorter;
import org.pushingpixels.substance.api.SubstanceCortex;
import org.pushingpixels.substance.api.skin.BusinessBlueSteelSkin;
import com.toedter.calendar.JDateChooser;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.io.FileWriter;
import com.opencsv.CSVWriter;
import com.itextpdf.text.Document;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.PdfPTable;
import hardwarehub_login.LoaderDialog;
import hardwarehub_main.dao.AuditLogDAO;
import java.math.BigDecimal;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.TableCellRenderer;
import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.AuditLog;
import hardwarehub_main.model.Product;
import javax.swing.SwingWorker;

public class StockMovementsPanel extends JPanel implements hardwarehub_main.util.JMenuBarProvider {

    private final DefaultTableModel tableModel;
    private final JTable table;
    private JComboBox<String> typeFilter;
    private JComboBox<String> statusFilter;
    private JTextField productFilter;
    private JDateChooser dateFromChooser;
    private JDateChooser dateToChooser;
    private JComboBox<String> deliveryMethodFilter;
    private final TableRowSorter<DefaultTableModel> sorter;
    private final DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final String[] COLUMN_NAMES = {
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

    private static final Class<?>[] COLUMN_TYPES = {
        Integer.class, // Transaction ID
        String.class, // Date
        String.class, // Transaction Type
        String.class, // Products
        String.class, // Quantity
        String.class, // Unit Price
        String.class, // Total Price
        BigDecimal.class, // Grand Total
        String.class, // Buyer/Supplier
        String.class, // Seller
        String.class, // Delivery Method
        String.class // Transaction Status
    };

    private static final String[] DELIVERY_METHODS = {"Pickup", "Delivery", "COD", "Walk-In"};

    // Glass pane loader overlay for dashboard return
    private JPanel loaderPane = null;

    public StockMovementsPanel() {
        super(new BorderLayout());
        setBackground(UIConstants.BACKGROUND);
        // Remove menu bar logic from constructor
        // Ribbon
        JToolBar ribbon = createRibbon();
        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.add(ribbon, BorderLayout.NORTH);
        // Filters panel
        JPanel filterPanel = createFilterPanel();
        topPanel.add(filterPanel, BorderLayout.CENTER);
        add(topPanel, BorderLayout.NORTH);

        // Table
        tableModel = new DefaultTableModel(COLUMN_NAMES, 0) {
            @Override
            public boolean isCellEditable(int r, int c) {
                return false;
            }
        };
        table = new JTable(tableModel);
        table.setFillsViewportHeight(true);
        table.setBackground(UIConstants.PANEL_BG);
        table.setRowHeight(28);
        sorter = new TableRowSorter<>(tableModel);
        table.setRowSorter(sorter);
        JScrollPane scroll = new JScrollPane(table);
        add(scroll, BorderLayout.CENTER);

        // Add custom renderer for multi-line cells
        initTable();
    }

    // Call this after the panel is shown in the frame
    public void onPanelShown() {
        java.awt.Window w = SwingUtilities.getWindowAncestor(this);
        if (w instanceof JFrame frame) {
            frame.setJMenuBar(createMenuBar());
            frame.setCursor(Cursor.getPredefinedCursor(Cursor.WAIT_CURSOR));
        }
        // Load data in background
        SwingWorker<Void, Void> worker = new SwingWorker<>() {
            @Override
            protected Void doInBackground() {
                // Load data (no UI updates here)
                // We'll call loadTable with nulls, but update table model on EDT
                List<Transaction> txns = TransactionDAO.getAllTransactions();
                List<Object[]> rows = new java.util.ArrayList<>();
                for (Transaction txn : txns) {
                    List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
                    StringBuilder productsBuilder = new StringBuilder();
                    StringBuilder quantitiesBuilder = new StringBuilder();
                    StringBuilder unitPricesBuilder = new StringBuilder();
                    StringBuilder totalPricesBuilder = new StringBuilder();
                    for (TransactionItem item : items) {
                        productsBuilder.append(item.getProductName()).append("\n");
                        quantitiesBuilder.append(item.getQuantity()).append("\n");
                        unitPricesBuilder.append(item.getUnitPrice().toPlainString()).append("\n");
                        totalPricesBuilder.append(item.getTotalPrice().toPlainString()).append("\n");
                    }
                    if (productsBuilder.length() > 0) {
                        rows.add(new Object[]{
                            txn.getTransactionId(),
                            txn.getTransactionDate() != null ? txn.getTransactionDate().toString() : "",
                            txn.getTransactionType(),
                            productsBuilder.toString().trim(),
                            quantitiesBuilder.toString().trim(),
                            unitPricesBuilder.toString().trim(),
                            totalPricesBuilder.toString().trim(),
                            txn.getGrandTotal(),
                            txn.getBuyerName() != null && !txn.getBuyerName().isBlank() ? txn.getBuyerName() : txn.getSellerName(),
                            txn.getSellerName(),
                            txn.getDeliveryMethod(),
                            txn.getTransactionStatus() != null ? txn.getTransactionStatus() : "Ongoing"
                        });
                    }
                }
                // Update table model on EDT
                SwingUtilities.invokeLater(() -> {
                    tableModel.setRowCount(0);
                    for (Object[] row : rows) {
                        tableModel.addRow(row);
                    }
                    java.awt.Window w2 = SwingUtilities.getWindowAncestor(StockMovementsPanel.this);
                    if (w2 instanceof JFrame frame2) {
                        frame2.setCursor(Cursor.getDefaultCursor());
                    }
                });
                return null;
            }
        };
        worker.execute();
    }

    private JPanel createFilterPanel() {
        JPanel filterPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 10));
        filterPanel.setBackground(UIConstants.PANEL_BG);
        filterPanel.setBorder(new EmptyBorder(5, 10, 5, 10));
        filterPanel.add(new JLabel("Type:"));
        typeFilter = new JComboBox<>(getAllTypes());
        filterPanel.add(typeFilter);
        filterPanel.add(new JLabel("Status:"));
        statusFilter = new JComboBox<>(new String[]{"All", "Ongoing", "Completed", "Cancelled"});
        filterPanel.add(statusFilter);
        filterPanel.add(new JLabel("Product:"));
        productFilter = new JTextField(12);
        filterPanel.add(productFilter);
        filterPanel.add(new JLabel("Date from:"));
        dateFromChooser = new JDateChooser();
        dateFromChooser.setDateFormatString("yyyy-MM-dd");
        filterPanel.add(dateFromChooser);
        filterPanel.add(new JLabel("to"));
        dateToChooser = new JDateChooser();
        dateToChooser.setDateFormatString("yyyy-MM-dd");
        filterPanel.add(dateToChooser);
        filterPanel.add(new JLabel("Delivery Method:"));
        deliveryMethodFilter = new JComboBox<>(DELIVERY_METHODS);
        deliveryMethodFilter.insertItemAt("All", 0);
        deliveryMethodFilter.setSelectedIndex(0);
        filterPanel.add(deliveryMethodFilter);

        // Add listeners for instant filter application
        typeFilter.addActionListener(e -> applyFilters());
        statusFilter.addActionListener(e -> applyFilters());
        deliveryMethodFilter.addActionListener(e -> applyFilters());
        dateFromChooser.getDateEditor().addPropertyChangeListener(e -> applyFilters());
        dateToChooser.getDateEditor().addPropertyChangeListener(e -> applyFilters());
        productFilter.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) {
                applyFilters();
            }

            public void removeUpdate(javax.swing.event.DocumentEvent e) {
                applyFilters();
            }

            public void changedUpdate(javax.swing.event.DocumentEvent e) {
                applyFilters();
            }
        });

        return filterPanel;
    }

    private JToolBar createRibbon() {
        JToolBar ribbon = new JToolBar();
        ribbon.setFloatable(false);
        ribbon.setBackground(UIConstants.PANEL_BG);
        ribbon.setPreferredSize(new Dimension(0, UIConstants.RIBBON_HEIGHT));
        ribbon.setMinimumSize(new Dimension(0, UIConstants.RIBBON_HEIGHT));
        ribbon.setMaximumSize(new Dimension(Integer.MAX_VALUE, UIConstants.RIBBON_HEIGHT));

        // Navigation group
        ribbon.add(createGroupPanel("Navigation",
                createAction("Back", "BackButton.png", e -> onBack())
        ));
        ribbon.addSeparator(new Dimension(20, 0));

        // View group
        ribbon.add(createGroupPanel("View",
                createAction("Refresh Table", "Transaction/ReloadTransactionsButton.png", e -> refreshTable()),
                createAction("Edit Transaction", "Transaction/EditTransactionButton.png", e -> onEditTransaction())
        ));
        ribbon.addSeparator(new Dimension(20, 0));

        // Reports group
        ribbon.add(createGroupPanel("Reports",
                createAction("Import Transactions", "Transaction/ImportTransactionsButton.png", e -> onImport()),
                createAction("Export Transactions", "Transaction/ExportTransactionsButton.png", e -> onExport())
        ));
        ribbon.addSeparator(new Dimension(20, 0));

        // Help group
        ribbon.add(createGroupPanel("Help",
                createAction("Help", "Transaction/AboutIconButton.png", e -> onHelp())
        ));
        return ribbon;
    }

    private JPanel createGroupPanel(String title, JButton... buttons) {
        JPanel btnPanel = new JPanel(new GridLayout(1, buttons.length, 5, 5));
        btnPanel.setBackground(UIConstants.PANEL_BG);
        for (JButton b : buttons) {
            btnPanel.add(b);
        }
        JPanel wrapper = new JPanel(new BorderLayout());
        wrapper.setBackground(UIConstants.PANEL_BG);
        wrapper.setBorder(BorderFactory.createTitledBorder(title));
        wrapper.add(btnPanel, BorderLayout.CENTER);
        return wrapper;
    }

    private String getKeyShortcutText(String action) {
        return switch (action) {
            case "Back" ->
                "Alt+Left";
            case "Refresh Table" ->
                "Ctrl+R";
            case "Import Transactions" ->
                "Ctrl+O";
            case "Export Transactions" ->
                "Ctrl+S";
            case "Edit Transaction" ->
                "Ctrl+E";
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
                            try { Thread.sleep(700); } catch (InterruptedException ignored) {}
                            return null;
                        }
                        @Override
                        protected void done() {
                            hardwarehub_main.gui.dashboard.DashboardPanel dash = new hardwarehub_main.gui.dashboard.DashboardPanel(frame);
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

    private void refreshTable() {
        loadTable(null, null, null, null, null, null);
    }

    private void onImport() {
        Window owner = SwingUtilities.getWindowAncestor(this);
        ImportTransactionsDialog dialog = new ImportTransactionsDialog(owner);
        dialog.setVisible(true);
    }

    private void onExport() {
        // Gather visible transactions from the table, applying current table filters
        java.util.List<Transaction> visibleTxns = new java.util.ArrayList<>();
        for (int i = 0; i < sorter.getViewRowCount(); i++) {
            int modelRow = sorter.convertRowIndexToModel(i);
            // Assuming Transaction ID is in the first column (index 0)
            Object txnIdObj = tableModel.getValueAt(modelRow, 0);
            if (txnIdObj instanceof Integer txnId) {
                Transaction txn = TransactionDAO.getTransactionById(txnId);
                if (txn != null) {
                    visibleTxns.add(txn);
                }
            }
        }

        if (visibleTxns.isEmpty() && tableModel.getRowCount() > 0) {
            // If table has rows but none matched by ID (e.g., if ID column is wrong),
            // fall back to attempting to get all transactions from DAO based on current table state.
            // This is a safety net; ideally the above loop works.
            List<Transaction> allFilteredTxns = TransactionDAO.getAllTransactions();
            // Further filter this list based on current table filters if possible/necessary, or log a warning.
            // For simplicity now, if visibleTxns is empty but tableModel has rows, let's just log or show a message,
            // as the primary gathering method from sorted rows is intended.
            // JOptionPane.showMessageDialog(this, "Could not retrieve transactions from table rows for export.", "Error", JOptionPane.WARNING_MESSAGE);
            // Revert to showing dialog with empty list or all transactions depending on desired fallback.
            // Let's show the dialog with an empty list if no visible transactions could be gathered from rows.
        } else if (visibleTxns.isEmpty() && tableModel.getRowCount() == 0) {
            JOptionPane.showMessageDialog(this, "No transactions to export.", "Info", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        // Use the ExportTransactionsDialog to handle the export format and process
        Window owner = SwingUtilities.getWindowAncestor(this);
        ExportTransactionsDialog dialog = new ExportTransactionsDialog(owner, visibleTxns);
        dialog.setVisible(true);
    }

    private void onHelp() {
        StringBuilder sb = new StringBuilder();
        sb.append("STOCK MOVEMENTS PANEL HELP\n\n");
        sb.append("Purpose:\n");
        sb.append("- View, filter, and manage all stock movement transactions (sales, returns, adjustments, etc.).\n\n");
        sb.append("Main Processes:\n");
        sb.append("- Filter/search transactions by type, status, product, date, or delivery method.\n");
        sb.append("- Edit transaction details, including products, quantities, and status.\n");
        sb.append("- Import or export transaction records.\n");
        sb.append("- View transaction status (Ongoing, Completed, Cancelled) with color-coded rows.\n\n");
        sb.append("Ribbon & Menu Bar Buttons:\n");
        sb.append("- Back: Return to dashboard.\n");
        sb.append("- Refresh Table: Reload transaction list.\n");
        sb.append("- Edit Transaction: Edit the selected transaction.\n");
        sb.append("- Import Transactions: Import transactions from file.\n");
        sb.append("- Export Transactions: Export transaction data.\n");
        sb.append("- Help: Show this help dialog.\n\n");
        sb.append("Keyboard Shortcuts:\n");
        sb.append("- Back: Alt+Left\n");
        sb.append("- Refresh Table: Ctrl+R\n");
        sb.append("- Edit Transaction: Ctrl+E\n");
        sb.append("- Import Transactions: Ctrl+O\n");
        sb.append("- Export Transactions: Ctrl+S\n");
        sb.append("- Help: Ctrl+H\n");
        sb.append("- Exit: Escape\n\n");
        sb.append("Developed by: JCBP Solutions © 2025\nHardwareHub v1.0");
        JOptionPane.showMessageDialog(this, sb.toString(), "Stock Movements Help", JOptionPane.INFORMATION_MESSAGE);
    }

    private String[] getAllTypes() {
        List<Transaction> txns = TransactionDAO.getAllTransactions();
        java.util.Set<String> types = txns.stream().map(Transaction::getTransactionType).collect(java.util.stream.Collectors.toSet());
        String[] arr = new String[types.size() + 1];
        arr[0] = "All";
        int i = 1;
        for (String t : types) {
            arr[i++] = t;
        }
        return arr;
    }

    private void loadTable(String type, String status, String product, LocalDate from, LocalDate to, String deliveryMethod) {
        tableModel.setRowCount(0);
        List<Transaction> txns = TransactionDAO.getAllTransactions();

        for (Transaction txn : txns) {
            // Filter by type/date at header level
            if (type != null && !type.equals("All") && !type.equalsIgnoreCase(txn.getTransactionType())) {
                continue;
            }
            if (status != null && !status.equals("All") && (txn.getTransactionStatus() == null || !status.equalsIgnoreCase(txn.getTransactionStatus()))) {
                continue;
            }
            if (from != null && txn.getTransactionDate() != null && txn.getTransactionDate().isBefore(from)) {
                continue;
            }
            if (to != null && txn.getTransactionDate() != null && txn.getTransactionDate().isAfter(to)) {
                continue; //the to here is being flagged as errors
            }
            if (deliveryMethod != null && !deliveryMethod.equals("All") && (txn.getDeliveryMethod() == null || !deliveryMethod.equalsIgnoreCase(txn.getDeliveryMethod()))) {
                continue;
            }

            List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());

            // Build the products, quantities, and prices strings
            StringBuilder productsBuilder = new StringBuilder();
            StringBuilder quantitiesBuilder = new StringBuilder();
            StringBuilder unitPricesBuilder = new StringBuilder();
            StringBuilder totalPricesBuilder = new StringBuilder();

            for (TransactionItem item : items) {
                // Filter by product at item level if needed
                if (product != null && !product.isBlank()
                        && !item.getProductName().toLowerCase().contains(product.toLowerCase())) {
                    continue;
                }

                productsBuilder.append(item.getProductName()).append("\n");
                quantitiesBuilder.append(item.getQuantity()).append("\n");
                unitPricesBuilder.append(item.getUnitPrice().toPlainString()).append("\n");
                totalPricesBuilder.append(item.getTotalPrice().toPlainString()).append("\n");
            }

            if (productsBuilder.length() > 0) {
                tableModel.addRow(new Object[]{
                    txn.getTransactionId(),
                    txn.getTransactionDate() != null ? txn.getTransactionDate().toString() : "",
                    txn.getTransactionType(),
                    productsBuilder.toString().trim(),
                    quantitiesBuilder.toString().trim(),
                    unitPricesBuilder.toString().trim(),
                    totalPricesBuilder.toString().trim(),
                    txn.getGrandTotal(),
                    txn.getBuyerName() != null && !txn.getBuyerName().isBlank()
                    ? txn.getBuyerName() : txn.getSellerName(),
                    txn.getSellerName(),
                    txn.getDeliveryMethod(),
                    txn.getTransactionStatus() != null ? txn.getTransactionStatus() : "Ongoing"
                });
            }
        }
    }

    private void applyFilters() {
        String type = (String) typeFilter.getSelectedItem();
        String status = (String) statusFilter.getSelectedItem();
        String product = productFilter.getText().trim();
        java.util.Date fromDate = dateFromChooser.getDate();
        java.util.Date toDate = dateToChooser.getDate();
        String deliveryMethod = (String) deliveryMethodFilter.getSelectedItem();
        LocalDate from = null, to = null;
        if (fromDate != null) {
            from = new java.sql.Date(fromDate.getTime()).toLocalDate();
        }
        if (toDate != null) {
            to = new java.sql.Date(toDate.getTime()).toLocalDate();
        }
        loadTable(type, status, product, from, to, deliveryMethod);
    }

    // --- For compatibility with existing button/action signature
    private void applyFilters(ActionEvent e) {
        applyFilters();
    }

    // --- Menu Bar ---
    public JMenuBar createMenuBar() {
        JMenuBar menuBar = new JMenuBar();

        // File menu
        JMenu fileMenu = new JMenu("File");
        fileMenu.add(createMenuItem("Import Transactions", KeyStroke.getKeyStroke(KeyEvent.VK_O, InputEvent.CTRL_DOWN_MASK), e -> onImport()));
        fileMenu.add(createMenuItem("Export Transactions", KeyStroke.getKeyStroke(KeyEvent.VK_S, InputEvent.CTRL_DOWN_MASK), e -> onExport()));
        menuBar.add(fileMenu);

        // View menu
        JMenu viewMenu = new JMenu("View");
        viewMenu.add(createMenuItem("Refresh Table", KeyStroke.getKeyStroke(KeyEvent.VK_R, InputEvent.CTRL_DOWN_MASK), e -> refreshTable()));
        menuBar.add(viewMenu);

        // Help menu
        JMenu helpMenu = new JMenu("Help");
        helpMenu.add(createMenuItem("About", KeyStroke.getKeyStroke(KeyEvent.VK_H, InputEvent.CTRL_DOWN_MASK), e -> onHelp()));
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
        bindKey(rootPane, "back", KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, InputEvent.ALT_DOWN_MASK), e -> onBack());
        bindKey(rootPane, "refresh", KeyStroke.getKeyStroke(KeyEvent.VK_R, InputEvent.CTRL_DOWN_MASK), e -> refreshTable());
        bindKey(rootPane, "import", KeyStroke.getKeyStroke(KeyEvent.VK_O, InputEvent.CTRL_DOWN_MASK), e -> onImport());
        bindKey(rootPane, "export", KeyStroke.getKeyStroke(KeyEvent.VK_S, InputEvent.CTRL_DOWN_MASK), e -> onExport());
        bindKey(rootPane, "help", KeyStroke.getKeyStroke(KeyEvent.VK_H, InputEvent.CTRL_DOWN_MASK), e -> onHelp());
        bindKey(rootPane, "editTransaction", KeyStroke.getKeyStroke(KeyEvent.VK_E, InputEvent.CTRL_DOWN_MASK), e -> {
            int row = table.getSelectedRow();
            if (row != -1) {
                String status = table.getValueAt(row, 11).toString();
                if ("Ongoing".equalsIgnoreCase(status)) {
                    onEditTransaction();
                }
            }
        });
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

    // Add custom renderer for multi-line cells
    private void initTable() {
        TableCellRenderer multiLineRenderer = new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {
                Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
                int modelRow = table.convertRowIndexToModel(row);
                String status = table.getModel().getValueAt(modelRow, 11).toString();
                if (!isSelected) {
                    if ("Cancelled".equalsIgnoreCase(status)) {
                        c.setBackground(new java.awt.Color(255, 102, 102)); // Red
                    } else if ("Ongoing".equalsIgnoreCase(status)) {
                        c.setBackground(new java.awt.Color(102, 178, 255)); // Blue
                    } else if ("Completed".equalsIgnoreCase(status)) {
                        c.setBackground(new java.awt.Color(102, 255, 178)); // Green
                    } else {
                        c.setBackground(table.getBackground());
                    }
                } else {
                    c.setBackground(table.getSelectionBackground());
                }
                if (value instanceof String) {
                    String stringValue = (String) value;
                    if (c instanceof JLabel) {
                        ((JLabel) c).setText(stringValue.replace("\n", "<br>"));
                        ((JLabel) c).setVerticalAlignment(JLabel.TOP);
                        ((JLabel) c).setText("<html>" + ((JLabel) c).getText() + "</html>");
                    }
                }
                return c;
            }
        };
        // Apply to all columns
        for (int col = 0; col < table.getColumnCount(); col++) {
            table.getColumnModel().getColumn(col).setCellRenderer(multiLineRenderer);
        }
        table.setRowHeight(60);
    }

    private void onEditTransaction() {
        int selectedRow = table.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Select a transaction to edit.", "Warning", JOptionPane.WARNING_MESSAGE);
            return;
        }
        int modelRow = table.convertRowIndexToModel(selectedRow);
        int txnId = (int) tableModel.getValueAt(modelRow, 0);
        Transaction txn = TransactionDAO.getTransactionById(txnId);
        if (txn == null) {
            JOptionPane.showMessageDialog(this, "Transaction not found.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        if (!"Ongoing".equalsIgnoreCase(txn.getTransactionStatus())) {
            JOptionPane.showMessageDialog(this, "Only ongoing transactions can be edited.", "Edit Not Allowed", JOptionPane.WARNING_MESSAGE);
            return;
        }
        List<TransactionItem> items = TransactionDAO.getTransactionItemsByTransactionId(txnId);
        txn.getTransactionItems().clear();
        txn.getTransactionItems().addAll(items);
        // --- Make a deep copy of the original items for stock delta calculation ---
        java.util.List<TransactionItem> oldItemsCopy = new java.util.ArrayList<>();
        for (TransactionItem item : items) {
            TransactionItem copy = new TransactionItem();
            copy.setProductId(item.getProductId());
            copy.setProductName(item.getProductName());
            copy.setQuantity(item.getQuantity());
            copy.setUnitPrice(item.getUnitPrice());
            copy.setTotalPrice(item.getTotalPrice());
            oldItemsCopy.add(copy);
        }
        EditTransactionDialog dialog = new EditTransactionDialog(SwingUtilities.getWindowAncestor(this), txn);
        dialog.setVisible(true);
        if (dialog.isUpdated()) {
            // Update transaction and items in DB
            TransactionDAO.updateTransaction(txn);
            TransactionDAO.deleteTransactionItemsByTransactionId(txnId);
            for (TransactionItem item : txn.getTransactionItems()) {
                item.setTransactionId(txnId);
                TransactionDAO.insertTransactionItem(item);
            }

            // --- Inventory stock update logic (delta-based, using oldItemsCopy) ---
            java.util.Map<Integer, Integer> oldQtyMap = new java.util.HashMap<>();
            for (TransactionItem item : oldItemsCopy) {
                oldQtyMap.put(item.getProductId(), item.getQuantity());
            }
            java.util.Map<Integer, Integer> newQtyMap = new java.util.HashMap<>();
            for (TransactionItem item : txn.getTransactionItems()) {
                newQtyMap.put(item.getProductId(), item.getQuantity());
            }
            java.util.Set<Integer> allProductIds = new java.util.HashSet<>();
            allProductIds.addAll(oldQtyMap.keySet());
            allProductIds.addAll(newQtyMap.keySet());
            String txnType = txn.getTransactionType();

            hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
            int sellerId = user != null ? user.getSellerId() : 0;
            java.time.LocalDateTime now = java.time.LocalDateTime.now();

            // Only update inventory for Sale PO if status is "Completed"
            boolean isSalePO = "Sale PO".equalsIgnoreCase(txnType);

            for (Integer productId : allProductIds) {
                Product product = ProductDAO.getProductById(productId);
                if (product == null) {
                    continue;
                }
                int oldQty = oldQtyMap.getOrDefault(productId, 0);
                int newQty = newQtyMap.getOrDefault(productId, 0);
                int delta = 0;
                if (isSalePO) {
                    // --- KEY FIX: Only update inventory if status is now "Completed"
                    if ("Completed".equalsIgnoreCase(txn.getTransactionStatus())) {
                        // Always deduct the full new quantity (not the difference)
                        int updatedQty = product.getQuantity() - newQty;
                        delta = -newQty;
                        if (updatedQty < 0) {
                            JOptionPane.showMessageDialog(this, "Negative stock for: " + product.getProductName(), "Stock Error", JOptionPane.ERROR_MESSAGE);
                            continue;
                        }
                        product.setQuantity(updatedQty);
                        ProductDAO.updateProduct(product);
                    }
                } else {
                    switch (txnType) {
                        case "Restock":
                        case "Return":
                            delta = newQty - oldQty;
                            break;
                        case "Adjustment":
                            delta = newQty - oldQty;
                            break;
                        case "Damage":
                        case "Sale Walk-In":
                            delta = oldQty - newQty;
                            break;
                        default:
                            delta = 0;
                    }
                    if ("Adjustment".equalsIgnoreCase(txnType)) {
                        product.setQuantity(newQty);
                    } else {
                        int updatedQty = product.getQuantity() + delta;
                        if (updatedQty < 0) {
                            JOptionPane.showMessageDialog(this, "Negative stock for: " + product.getProductName(), "Stock Error", JOptionPane.ERROR_MESSAGE);
                            continue;
                        }
                        product.setQuantity(updatedQty);
                    }
                    ProductDAO.updateProduct(product);
                }

                // --- Add audit log for each stock movement ---
                String details = String.format(
                        "Product: %s | Transaction: %s (ID: %d) | Old Qty: %d | New Qty: %d | Delta: %+d",
                        product.getProductName(), txnType, txn.getTransactionId(), oldQty, newQty, delta
                );
                AuditLogDAO.insertAuditLog(
                        new AuditLog(
                                0,
                                sellerId,
                                now,
                                true,
                                "EditTransactionDialog",
                                txnType,
                                details
                        )
                );
            }
            refreshTable();
        }
    }

    public static void main(String[] args) {
        // Ensure UI creation on EDT
        SwingUtilities.invokeLater(() -> {
            SubstanceCortex.GlobalScope.setSkin(new BusinessBlueSteelSkin());

            // Create frame
            JFrame frame = new JFrame("HardwareHub Stock Movements");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(1650, 1000);
            frame.setLocationRelativeTo(null);

            // Optionally set app icon
            ImageIcon logo = IconUtil.loadIcon("HardwareHub_Icon.png");
            frame.setIconImage(logo.getImage());

            // Create and add StockMovementsPanel
            StockMovementsPanel panel = new StockMovementsPanel();
            frame.setJMenuBar(panel.createMenuBar());
            frame.setContentPane(panel);
            panel.registerKeyBindings(frame.getRootPane());
            frame.revalidate();
            frame.repaint();
        });
    }
}
