package hardwarehub_main.gui.inventory;

import hardwarehub_login.LoaderDialog;
import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.model.Product;
import hardwarehub_main.model.Supplier;
import hardwarehub_main.util.IconUtil;
import static hardwarehub_main.util.IconUtil.loadIcon;
import hardwarehub_main.util.UIConstants;
import org.pushingpixels.substance.api.SubstanceCortex;
import org.pushingpixels.substance.api.skin.BusinessBlueSteelSkin;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.Image;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;
import java.awt.Graphics;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.event.MouseEvent;
import java.awt.event.MouseMotionAdapter;
import java.util.List;
import javax.swing.AbstractAction;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JRootPane;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.JToolBar;
import javax.swing.JTree;
import javax.swing.KeyStroke;
import javax.swing.RowSorter;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.border.EmptyBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableRowSorter;
import javax.swing.tree.*;
import javax.swing.event.TreeSelectionEvent;
import javax.swing.event.TreeSelectionListener;
import javax.swing.JCheckBox;
import javax.swing.DefaultCellEditor;
import javax.swing.JComboBox;
import javax.swing.SwingWorker;
import java.awt.Cursor;

/**
 * InventoryPanel provides the UI for browsing, filtering, and managing product
 * inventory with a Ribbon‐style toolbar.
 */
public class InventoryPanel extends JPanel implements hardwarehub_main.util.JMenuBarProvider {

    private static final String[] TABLE_COLUMNS = {
        "Product ID", "Product Name", "Category", "Supplier", "Price", "Quantity", "Min Threshold", "Available"
    };

    private final DefaultTableModel tableModel;
    private final JTable productTable;
    private final JPanel leftPanel;
    private final JButton btnShowCategories;
    private final JButton btnShowSuppliers;
    private final JScrollPane categoryTreeScroll;
    private final JTree categoryTree;
    private final DefaultTreeModel categoryTreeModel;
    private final DefaultMutableTreeNode rootCategoryNode;
    private ProductDAO productDAO = new ProductDAO();
    private JTextField searchField;
    private TableRowSorter<DefaultTableModel> sorter;
    private JButton btnMarkProduct;
    private JComboBox<String> cbSupplierFilter;
    private JCheckBox cbLowStock, cbNoStock, cbAvailableOnly, cbUnavailableOnly, cbFastMoving, cbMultiSupplier;
    private JPanel filterPanel;
    // Glass pane loader overlay for dashboard return
    private JPanel loaderPane = null;

    public InventoryPanel() {
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

        // Search filter above table
        JPanel searchPanel = new JPanel(new BorderLayout());
        searchPanel.setBackground(UIConstants.PANEL_BG);
        searchPanel.setBorder(new EmptyBorder(5, 10, 5, 10));
        searchField = new JTextField();
        searchField.setToolTipText("Search product name...");
        searchPanel.add(new JLabel("Search: "), BorderLayout.WEST);
        searchPanel.add(searchField, BorderLayout.CENTER);
        searchField.getDocument().addDocumentListener(new DocumentListener() {
            public void insertUpdate(DocumentEvent e) {
                filterProducts();
            }

            public void removeUpdate(DocumentEvent e) {
                filterProducts();
            }

            public void changedUpdate(DocumentEvent e) {
                filterProducts();
            }
        });

        // --- Enhanced Filters ---
        addEnhancedFilters();

        // Top panel to hold both ribbon and search
        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.add(ribbon, BorderLayout.NORTH);
        topPanel.add(searchPanel, BorderLayout.CENTER);
        topPanel.add(filterPanel, BorderLayout.SOUTH);
        add(topPanel, BorderLayout.NORTH);

        // Left filter panel
        leftPanel = new JPanel();
        leftPanel.setLayout(new BoxLayout(leftPanel, BoxLayout.Y_AXIS));
        leftPanel.setBackground(UIConstants.PANEL_BG);
        leftPanel.setBorder(new EmptyBorder(10, 10, 10, 10));

        btnShowCategories = new JButton("Show All Categories");
        btnShowCategories.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnShowSuppliers = new JButton("Show All Suppliers");
        btnShowSuppliers.setAlignmentX(Component.CENTER_ALIGNMENT);

        leftPanel.add(btnShowCategories);
        leftPanel.add(Box.createRigidArea(new Dimension(0, 10)));
        leftPanel.add(btnShowSuppliers);
        leftPanel.add(Box.createVerticalGlue());

        JScrollPane leftScroll = new JScrollPane(leftPanel);
        leftScroll.setPreferredSize(new Dimension(260, 0));
        add(leftScroll, BorderLayout.WEST);

        // Category tree setup (but not shown initially)
        rootCategoryNode = new DefaultMutableTreeNode("All Categories");
        categoryTreeModel = new DefaultTreeModel(rootCategoryNode);
        categoryTree = new JTree(categoryTreeModel);
        categoryTree.setRootVisible(false);
        categoryTree.setShowsRootHandles(true);
        categoryTree.setCellRenderer(new DefaultTreeCellRenderer() {
            @Override
            public Component getTreeCellRendererComponent(JTree tree, Object value, boolean sel, boolean expanded, boolean leaf, int row, boolean hasFocus) {
                Component c = super.getTreeCellRendererComponent(tree, value, sel, expanded, leaf, row, hasFocus);
                if (value instanceof DefaultMutableTreeNode node) {
                    Object userObj = node.getUserObject();
                    if (userObj instanceof hardwarehub_main.model.Category cat) {
                        setText(cat.getCategory());
                        if (!cat.isAvailable()) {
                            setForeground(Color.GRAY);
                        }
                    }
                }
                return c;
            }
        });
        categoryTreeScroll = new JScrollPane(categoryTree, JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED, JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
        categoryTreeScroll.setPreferredSize(new Dimension(260, 0));

        // Button actions
        btnShowCategories.addActionListener(e -> {
            loadCategoryTree();
            loadProducts(null);
            if (leftPanel.getComponentCount() < 4 || leftPanel.getComponent(1) != categoryTreeScroll) {
                leftPanel.add(categoryTreeScroll, 1);
                leftPanel.revalidate();
                leftPanel.repaint();
            }
        });
        btnShowSuppliers.addActionListener(e -> {
            if (leftPanel.getComponentCount() > 1 && leftPanel.getComponent(1) == categoryTreeScroll) {
                leftPanel.remove(categoryTreeScroll);
                leftPanel.revalidate();
                leftPanel.repaint();
            }
            showAllSuppliers();
        });

        categoryTree.addTreeSelectionListener(e -> {
            DefaultMutableTreeNode node = (DefaultMutableTreeNode) categoryTree.getLastSelectedPathComponent();
            if (node == null) {
                return;
            }
            Object userObj = node.getUserObject();
            if (userObj instanceof hardwarehub_main.model.Category cat) {
                if (cat.isAvailable()) {
                    loadProducts(cat.getCategory());
                }
            }
        });

        // Center table
        tableModel = new DefaultTableModel(TABLE_COLUMNS, 0) {
            @Override
            public boolean isCellEditable(int r, int c) {
                // Only allow editing 'Available' column if category and supplier are available
                if (c == 7) {
                    int modelRow = r;
                    int productId = (int) getValueAt(modelRow, 0);
                    Product p = ProductDAO.getProductById(productId);
                    if (p == null) {
                        return false;
                    }
                    boolean catAvail = true, supAvail = true;
                    hardwarehub_main.model.Category cat = hardwarehub_main.dao.CategoryDAO.getCategoryById(p.getCategoryId());
                    if (cat != null) {
                        catAvail = cat.isAvailable();
                    }
                    hardwarehub_main.model.Supplier sup = hardwarehub_main.dao.SupplierDAO.getSupplierById(p.getSupplierId());
                    if (sup != null) {
                        supAvail = sup.isAvailable();
                    }
                    return catAvail && supAvail;
                }
                return false;
            }

            @Override
            public Class<?> getColumnClass(int col) {
                if (col == 7) {
                    return Boolean.class;
                }
                return super.getColumnClass(col);
            }
        };
        productTable = new JTable(tableModel);
        productTable.setFillsViewportHeight(true);
        // Custom renderer for low-stock alerts
        productTable.setDefaultRenderer(Object.class, new javax.swing.table.DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(javax.swing.JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {
                Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
                int modelRow = table.convertRowIndexToModel(row);
                int quantity = 0, minThreshold = 0;
                try {
                    quantity = Integer.parseInt(table.getModel().getValueAt(modelRow, 5).toString());
                    minThreshold = Integer.parseInt(table.getModel().getValueAt(modelRow, 6).toString());
                } catch (Exception e) {
                    /* ignore parse errors */ }
                if (quantity == 0) {
                    c.setBackground(isSelected ? new java.awt.Color(255, 102, 102) : new java.awt.Color(255, 153, 153)); // Red
                } else if (quantity <= minThreshold) {
                    c.setBackground(isSelected ? new java.awt.Color(255, 255, 153) : new java.awt.Color(255, 255, 204)); // Yellow
                } else {
                    c.setBackground(isSelected ? table.getSelectionBackground() : table.getBackground());
                }
                return c;
            }
        });
        sorter = new TableRowSorter<>(tableModel);
        productTable.setRowSorter(sorter);
        add(new JScrollPane(productTable), BorderLayout.CENTER);

        // --- Persist 'Available' checkbox changes ---
        tableModel.addTableModelListener(e -> {
            if (e.getType() == javax.swing.event.TableModelEvent.UPDATE && e.getColumn() == 7) {
                int row = e.getFirstRow();
                if (row < 0) {
                    return;
                }
                int productId = (int) tableModel.getValueAt(row, 0);
                Boolean available = (Boolean) tableModel.getValueAt(row, 7);
                Product product = ProductDAO.getProductById(productId);
                if (product != null) {
                    boolean oldAvailable = product.isAvailable();
                    // Only allow unchecking (making unavailable)
                    if (oldAvailable && !available) {
                        int confirm = JOptionPane.showConfirmDialog(this, "Mark this product as unavailable? This will set its quantity to 0 and cannot be undone except by restocking.", "Confirm Unavailability", JOptionPane.YES_NO_OPTION, JOptionPane.WARNING_MESSAGE);
                        if (confirm == JOptionPane.YES_OPTION) {
                            product.setAvailable(false);
                            product.setQuantity(0);
                    product.setUpdatedAt(java.time.LocalDateTime.now());
                    boolean success = ProductDAO.updateProduct(product);
                            // Audit log
                    hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                    String sellerName = user != null ? user.getSellerName() : "Unknown";
                    java.time.LocalDateTime now = java.time.LocalDateTime.now();
                            String details = "Marked product unavailable: " + product.getProductName() + " (ID: " + product.getProductId() + ") by " + sellerName;
                            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, now, success, "InventoryPanel", "Mark Unavailable", details));
                            // Update table: keep checkbox unchecked and disabled
                            tableModel.setValueAt(false, row, 7);
                            productTable.getColumnModel().getColumn(7).setCellEditor(new javax.swing.DefaultCellEditor(new JCheckBox()) {
                                @Override
                                public boolean isCellEditable(java.util.EventObject e) {
                                    return false;
                                }
                            });
                        } else {
                            // Revert checkbox if cancelled
                            tableModel.setValueAt(true, row, 7);
                        }
                    } else if (!oldAvailable && available) {
                        // Prevent rechecking (making available)
                        JOptionPane.showMessageDialog(this, "Unavailable products can only be made available through restocking.", "Action Restricted", JOptionPane.WARNING_MESSAGE);
                        tableModel.setValueAt(false, row, 7);
                    }
                }
                // Refresh table to reflect changes
                loadProducts(null);
            }
        });

        // Load data
        loadCategoryTree();
        loadProducts(null);
        loadAllProducts();
    }

    private void loadAllProducts() {
        List<Product> products = productDAO.getAllProducts();
        displayProducts(products);
        checkLowStock(products);
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
                    hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "InventoryPanel", "Stock Alert", details));
                    logged = true;
                }
            } else if (p.getQuantity() <= p.getMinThreshold()) {
                warn.append("[LOW STOCK] ").append(p.getProductName()).append(" (" + p.getQuantity() + "/min " + p.getMinThreshold() + ")\n");
                // Log to audit log
                if (!logged) {
                    hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
                    int sellerId = user != null ? user.getSellerId() : 0;
                    java.time.LocalDateTime now = java.time.LocalDateTime.now();
                    String details = "LOW STOCK: " + p.getProductName() + " (" + p.getQuantity() + "/min " + p.getMinThreshold() + ")";
                    hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "InventoryPanel", "Stock Alert", details));
                    logged = true;
                }
            }
        }
        if (warn.length() > 0) {
            JOptionPane.showMessageDialog(this, warn.toString(), "Stock Warnings", JOptionPane.WARNING_MESSAGE);
        }
    }

    public JMenuBar createMenuBar() {
        JMenuBar menuBar = new JMenuBar();

        // File menu
        JMenu fileMenu = new JMenu("File");
        fileMenu.add(createMenuItem("Import Supplies", KeyStroke.getKeyStroke(KeyEvent.VK_O, InputEvent.CTRL_DOWN_MASK), e -> onImport()));
        fileMenu.add(createMenuItem("Export Report", KeyStroke.getKeyStroke(KeyEvent.VK_S, InputEvent.CTRL_DOWN_MASK), e -> onExport()));
        menuBar.add(fileMenu);

        // View menu
        JMenu viewMenu = new JMenu("View");
        viewMenu.add(createMenuItem("Refresh Table", KeyStroke.getKeyStroke(KeyEvent.VK_R, InputEvent.CTRL_DOWN_MASK), e -> loadProducts(null)));
        menuBar.add(viewMenu);

        // Help menu
        JMenu helpMenu = new JMenu("Help");
        helpMenu.add(createMenuItem("Help", KeyStroke.getKeyStroke(KeyEvent.VK_H, InputEvent.CTRL_DOWN_MASK), e -> onHelp()));
        menuBar.add(helpMenu);

        return menuBar;
    }

    private JMenuItem createMenuItem(String text, KeyStroke shortcut, ActionListener action) {
        JMenuItem item = new JMenuItem(text);
        item.setAccelerator(shortcut);
        item.addActionListener(action);
        return item;
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
                createAction("Back", "BackButton.png", e -> this.onBack())
        ));

        ribbon.addSeparator(new Dimension(20, 0));

        // View group
        ribbon.add(createGroupPanel("View",
                createAction("Refresh Table", "Inventory/ReloadSuppliesButton.png", e -> loadProducts(null))
        ));

        ribbon.addSeparator(new Dimension(20, 0));

        // Product group
        ribbon.add(createGroupPanel("Product",
                createAction("Add Product", "Inventory/AddProductButton.png", e -> openProductDialog(null)),
                createAction("Edit Product", "Inventory/EditProductInfoButton.png", e -> editProduct()),
                btnMarkProduct = createAction("Mark Product Unavailability", "Inventory/MarkProductButton.png", e -> markProduct())
        ));

        ribbon.addSeparator(new Dimension(20, 0));

        // Category group
        ribbon.add(createGroupPanel("Category",
                createAction("Add Category", "Inventory/AddCategoryButton.png", e -> onAddCategory()),
                createAction("Bulk Mark Categories", "Inventory/MarkCategoryButton.png", e -> bulkMarkCategories())
        ));

        ribbon.addSeparator(new Dimension(20, 0));

        // Supplier group
        ribbon.add(createGroupPanel("Supplier",
                createAction("Add Supplier", "Inventory/AddSupplierButton.png", e -> openSupplierDialog(null)),
                createAction("Edit Supplier", "Inventory/EditSupplierButton.png", e -> editSupplier()),
                createAction("Bulk Mark Suppliers", "Inventory/MarkSupplierButton.png", e -> bulkMarkSuppliers())
        ));

        ribbon.addSeparator(new Dimension(20, 0));

        // Reports group
        ribbon.add(createGroupPanel("Reports",
                createAction("Import Supplies", "Inventory/ImportSuppliesButton.png", e -> onImport()),
                createAction("Export Report", "Inventory/ExportSuppliesButton.png", e -> onExport())
        ));

        ribbon.addSeparator(new Dimension(20, 0));

        // Help group
        ribbon.add(createGroupPanel("Help",
                createAction("Help", "Inventory/AboutIconButton.png", e -> onHelp())
        ));

        return ribbon;
    }

    private JButton createIconOnlyButton(String iconPath, ActionListener action) {
        JButton button = new JButton(IconUtil.loadIcon(iconPath));
        button.setFocusable(false);
        button.setContentAreaFilled(false);
        button.setBorderPainted(false);
        button.setOpaque(false);
        button.addActionListener(action);
        return button;
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

    private JButton createAction(String text, String iconPath, ActionListener listener) {
        ImageIcon rawIcon = IconUtil.loadIcon(iconPath);
        Image scaledImg = rawIcon.getImage().getScaledInstance(32, 32, Image.SCALE_SMOOTH);
        ImageIcon icon = new ImageIcon(scaledImg);
        JButton btn = new JButton("<html><center>" + text + "</center></html>", icon);
        btn.setHorizontalTextPosition(SwingConstants.CENTER);
        btn.setVerticalTextPosition(SwingConstants.BOTTOM);
        btn.setPreferredSize(new Dimension(80, 70));
        btn.setBackground(UIConstants.BUTTON_BG);
        btn.setFocusable(false);
        btn.setToolTipText(text + " (" + getKeyShortcutText(text) + ")");
        btn.addActionListener(listener);
        return btn;
    }

    public void registerKeyBindings(JRootPane rootPane) {

        // Map keys to actions
        bindKey(rootPane, "back", KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, InputEvent.ALT_DOWN_MASK), e -> onBack());
        bindKey(rootPane, "refresh", KeyStroke.getKeyStroke(KeyEvent.VK_R, InputEvent.CTRL_DOWN_MASK), e -> loadProducts(null));
        bindKey(rootPane, "addProduct", KeyStroke.getKeyStroke(KeyEvent.VK_A, InputEvent.CTRL_DOWN_MASK | InputEvent.SHIFT_DOWN_MASK), e -> openProductDialog(null));
        bindKey(rootPane, "editProduct", KeyStroke.getKeyStroke(KeyEvent.VK_E, InputEvent.CTRL_DOWN_MASK | InputEvent.SHIFT_DOWN_MASK), e -> editProduct());
        bindKey(rootPane, "markProductUnavailability", KeyStroke.getKeyStroke(KeyEvent.VK_U, InputEvent.CTRL_DOWN_MASK | InputEvent.SHIFT_DOWN_MASK), e -> markProduct());

        bindKey(rootPane, "addCategory", KeyStroke.getKeyStroke(KeyEvent.VK_A, InputEvent.CTRL_DOWN_MASK | InputEvent.ALT_DOWN_MASK | InputEvent.SHIFT_DOWN_MASK), e -> onAddCategory());
        bindKey(rootPane, "bulkMarkCategories", KeyStroke.getKeyStroke(KeyEvent.VK_U, InputEvent.CTRL_DOWN_MASK | InputEvent.ALT_DOWN_MASK | InputEvent.SHIFT_DOWN_MASK), e -> bulkMarkCategories());

        bindKey(rootPane, "addSupplier", KeyStroke.getKeyStroke(KeyEvent.VK_A, InputEvent.CTRL_DOWN_MASK | InputEvent.ALT_DOWN_MASK), e -> openSupplierDialog(null));
        bindKey(rootPane, "editSupplier", KeyStroke.getKeyStroke(KeyEvent.VK_E, InputEvent.CTRL_DOWN_MASK | InputEvent.ALT_DOWN_MASK), e -> editSupplier());
        bindKey(rootPane, "bulkMarkSuppliers", KeyStroke.getKeyStroke(KeyEvent.VK_U, InputEvent.CTRL_DOWN_MASK | InputEvent.ALT_DOWN_MASK), e -> bulkMarkSuppliers());

        bindKey(rootPane, "import", KeyStroke.getKeyStroke(KeyEvent.VK_O, InputEvent.CTRL_DOWN_MASK), e -> onImport());
        bindKey(rootPane, "export", KeyStroke.getKeyStroke(KeyEvent.VK_S, InputEvent.CTRL_DOWN_MASK), e -> onExport());
        bindKey(rootPane, "help", KeyStroke.getKeyStroke(KeyEvent.VK_H, InputEvent.CTRL_DOWN_MASK), e -> onHelp());
    }

    private void bindKey(JRootPane root, String name, KeyStroke keyStroke, ActionListener action) {
        root.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(keyStroke, name);
        root.getActionMap().put(name, new AbstractAction() {
            public void actionPerformed(ActionEvent e) {
                action.actionPerformed(e);
            }
        });
    }

    private void bindEscapeKeyToClose(JDialog dialog) {
        JRootPane rootPane = dialog.getRootPane();

        KeyStroke escapeKeyStroke = KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0);
        String dispatchWindowClosingActionMapKey = "com.spotlight.CloseDialogOnEscape";

        rootPane.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW)
                .put(escapeKeyStroke, dispatchWindowClosingActionMapKey);
        rootPane.getActionMap().put(dispatchWindowClosingActionMapKey, new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                dialog.dispose();
            }
        });
    }

    private String getKeyShortcutText(String action) {
        return switch (action) {
            case "Back" ->
                "Alt+Left";
            case "Refresh Table" ->
                "Ctrl+R";
            case "Add Product" ->
                "Ctrl+Shift+A";
            case "Edit Product" ->
                "Ctrl+Shift+E";
            case "Mark Product Unavailability" ->
                "Ctrl+Shift+U";
            case "Add Category" ->
                "Ctrl+Alt+Shift+A";
            case "Bulk Mark Categories" ->
                "Ctrl+Alt+Shift+U";
            case "Add Supplier" ->
                "Ctrl+Alt+A";
            case "Edit Supplier" ->
                "Ctrl+Alt+E";
            case "Bulk Mark Suppliers" ->
                "Ctrl+Alt+U";
            case "Import Supplies" ->
                "Ctrl+O";
            case "Export Report" ->
                "Ctrl+S";
            case "Help" ->
                "Ctrl+H";
            case "Exit" ->
                "Escape";
            default ->
                "";
        };
    }

    private void loadCategoryTree() {
        rootCategoryNode.removeAllChildren();
        java.util.List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
        java.util.Map<Integer, DefaultMutableTreeNode> nodeMap = new java.util.HashMap<>();
        nodeMap.put(null, rootCategoryNode);
        for (hardwarehub_main.model.Category cat : categories) {
            DefaultMutableTreeNode node = new DefaultMutableTreeNode(cat);
            nodeMap.put(cat.getCategoryId(), node);
        }
        for (hardwarehub_main.model.Category cat : categories) {
            DefaultMutableTreeNode node = nodeMap.get(cat.getCategoryId());
            DefaultMutableTreeNode parent = nodeMap.get(cat.getParentCategoryId());
            if (parent != null) {
                parent.add(node);
            } else {
                rootCategoryNode.add(node);
            }
        }
        categoryTreeModel.reload();
        categoryTree.expandRow(0);
    }

    private java.util.Set<Integer> getAllDescendantCategoryIds(String categoryName) {
        // Get all categories from DAO
        List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
        // Find the category node for the selected name
        Integer rootId = null;
        for (hardwarehub_main.model.Category c : categories) {
            if (c.getCategory().equals(categoryName)) {
                rootId = c.getCategoryId();
                break;
            }
        }
        if (rootId == null) {
            return java.util.Collections.emptySet();
        }

        java.util.Set<Integer> result = new java.util.HashSet<>();
        collectDescendants(rootId, categories, result);
        return result;
    }

    private void collectDescendants(Integer parentId, List<hardwarehub_main.model.Category> categories, java.util.Set<Integer> result) {
        result.add(parentId);
        for (hardwarehub_main.model.Category c : categories) {
            if (parentId.equals(c.getParentCategoryId())) {
                collectDescendants(c.getCategoryId(), categories, result);
            }
        }
    }

    private void loadProducts(String category) {
        tableModel.setDataVector(new Object[0][0], TABLE_COLUMNS);

        List<Product> list;
        if (category == null) {
            list = ProductDAO.getAllProducts();
        } else {
            // Get all descendant category IDs
            java.util.Set<Integer> catIds = getAllDescendantCategoryIds(category);
            list = hardwarehub_main.dao.ProductDAO.getProductsByCategoryIds(catIds);
        }
        java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory = new java.util.HashMap<>();
        for (hardwarehub_main.model.Category c : hardwarehub_main.dao.CategoryDAO.getAllCategories()) {
            idToCategory.put(c.getCategoryId(), c);
        }
        for (Product p : list) {
            hardwarehub_main.model.Category cat = idToCategory.get(p.getCategoryId());
            String categoryDisplay = (cat != null) ? getIndentedCategoryName(cat, idToCategory) : "";
            tableModel.addRow(new Object[]{
                p.getProductId(),
                p.getProductName(),
                categoryDisplay,
                p.getSupplierName(),
                p.getUnitPrice(),
                p.getQuantity(),
                p.getMinThreshold(),
                p.isAvailable()
            });
        }
        // Re-apply custom renderer for products
        productTable.setDefaultRenderer(Object.class, new javax.swing.table.DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(javax.swing.JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {
                Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
                int modelRow = table.convertRowIndexToModel(row);
                int quantity = 0, minThreshold = 0;
                try {
                    quantity = Integer.parseInt(table.getModel().getValueAt(modelRow, 5).toString());
                    minThreshold = Integer.parseInt(table.getModel().getValueAt(modelRow, 6).toString());
                } catch (Exception e) {
                    /* ignore parse errors */ }
                if (quantity == 0) {
                    c.setBackground(isSelected ? new java.awt.Color(255, 102, 102) : new java.awt.Color(255, 153, 153)); // Red
                } else if (quantity <= minThreshold) {
                    c.setBackground(isSelected ? new java.awt.Color(255, 255, 153) : new java.awt.Color(255, 255, 204)); // Yellow
                } else {
                    c.setBackground(isSelected ? table.getSelectionBackground() : table.getBackground());
                }
                return c;
            }
        });
        // Sort by Product ID ascending after refresh
        sorter.setSortKeys(java.util.List.of(new RowSorter.SortKey(0, javax.swing.SortOrder.ASCENDING)));
        sorter.sort();
    }

    private void displayProducts(List<Product> products) {
        tableModel.setDataVector(new Object[0][0], TABLE_COLUMNS); // Restore product columns
        java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory = new java.util.HashMap<>();
        for (hardwarehub_main.model.Category c : hardwarehub_main.dao.CategoryDAO.getAllCategories()) {
            idToCategory.put(c.getCategoryId(), c);
        }
        for (Product p : products) {
            hardwarehub_main.model.Category cat = idToCategory.get(p.getCategoryId());
            String categoryDisplay = (cat != null) ? getIndentedCategoryName(cat, idToCategory) : "";
            tableModel.addRow(new Object[]{
                p.getProductId(),
                p.getProductName(),
                categoryDisplay,
                p.getSupplierName(),
                p.getUnitPrice(),
                p.getQuantity(),
                p.getMinThreshold(),
                p.isAvailable()
            });
        }
        // Re-apply custom renderer for products
        productTable.setDefaultRenderer(Object.class, new javax.swing.table.DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(javax.swing.JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {
                Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
                int modelRow = table.convertRowIndexToModel(row);
                int quantity = 0, minThreshold = 0;
                try {
                    quantity = Integer.parseInt(table.getModel().getValueAt(modelRow, 5).toString());
                    minThreshold = Integer.parseInt(table.getModel().getValueAt(modelRow, 6).toString());
                } catch (Exception e) {
                    /* ignore parse errors */ }
                if (quantity == 0) {
                    c.setBackground(isSelected ? new java.awt.Color(255, 102, 102) : new java.awt.Color(255, 153, 153)); // Red
                } else if (quantity <= minThreshold) {
                    c.setBackground(isSelected ? new java.awt.Color(255, 255, 153) : new java.awt.Color(255, 255, 204)); // Yellow
                } else {
                    c.setBackground(isSelected ? table.getSelectionBackground() : table.getBackground());
                }
                return c;
            }
        });
        // Sort by Product ID ascending after refresh
        sorter.setSortKeys(java.util.List.of(new RowSorter.SortKey(0, javax.swing.SortOrder.ASCENDING)));
        sorter.sort();
    }

    private static int levenshtein(String a, String b) {
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

    private void filterProducts() {
        String text = searchField.getText().trim();
        String supplierFilter = (cbSupplierFilter != null && cbSupplierFilter.getSelectedIndex() > 0) ? (String) cbSupplierFilter.getSelectedItem() : null;
        boolean lowStock = cbLowStock != null && cbLowStock.isSelected();
        boolean noStock = cbNoStock != null && cbNoStock.isSelected();
        boolean availableOnly = cbAvailableOnly != null && cbAvailableOnly.isSelected();
        boolean unavailableOnly = cbUnavailableOnly != null && cbUnavailableOnly.isSelected();
        boolean fastMoving = cbFastMoving != null && cbFastMoving.isSelected();
        boolean multiSupplier = cbMultiSupplier != null && cbMultiSupplier.isSelected();
        // No category/supplier selection in InventoryPanel, so pass null for those
        java.util.List<Product> filtered = hardwarehub_main.util.InventoryFilterUtil.filterProducts(
                hardwarehub_main.dao.ProductDAO.getAllProducts(),
                text,
                supplierFilter,
                lowStock,
                noStock,
                availableOnly,
                unavailableOnly,
                fastMoving,
                multiSupplier,
                null,
                null
        );
        tableModel.setRowCount(0);
        
        java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory = new java.util.HashMap<>();
        for (hardwarehub_main.model.Category c : hardwarehub_main.dao.CategoryDAO.getAllCategories()) {
            idToCategory.put(c.getCategoryId(), c);
        }
        
        for (Product p : filtered) {
            hardwarehub_main.model.Category cat = idToCategory.get(p.getCategoryId());
            String categoryDisplay = (cat != null) ? getIndentedCategoryName(cat, idToCategory) : "";
            tableModel.addRow(new Object[]{
                p.getProductId(),
                p.getProductName(),
                categoryDisplay,
                p.getSupplierName(),
                p.getUnitPrice(),
                p.getQuantity(),
                p.getMinThreshold(),
                p.isAvailable()
            });
        }
        
        sorter.setSortKeys(java.util.List.of(new RowSorter.SortKey(0, javax.swing.SortOrder.ASCENDING)));
        sorter.sort();
        // --- Audit log for filter action ---
        hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
        String sellerName = user != null ? user.getSellerName() : "Unknown";
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String details = "Applied filters: "
                + (cbSupplierFilter != null && cbSupplierFilter.getSelectedIndex() > 0 ? "Supplier=" + cbSupplierFilter.getSelectedItem() + ", " : "")
                + (lowStock ? "LowStock, " : "")
                + (noStock ? "NoStock, " : "")
                + (availableOnly ? "AvailableOnly, " : "")
                + (unavailableOnly ? "UnavailableOnly, " : "")
                + (fastMoving ? "FastMoving, " : "")
                + (multiSupplier ? "MultiSupplier, " : "")
                + (text.isEmpty() ? "" : "Search='" + text + "'");
        hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, now, true, "InventoryPanel", "Filter", details));
    }

    // --- Handlers for Ribbon buttons ---
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

    private void openProductDialog(Product prod) {
        ProductDialog dlg = new ProductDialog(
                SwingUtilities.getWindowAncestor(this), prod
        );
        dlg.setVisible(true);
        if (dlg.isSucceeded()) {
            loadProducts(null);
        }
    }

    private void editProduct() {
        int viewRow = productTable.getSelectedRow();
        if (viewRow < 0) {
            JOptionPane.showMessageDialog(this, "Select a product to edit.", "Warning",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        int modelRow = productTable.convertRowIndexToModel(viewRow);
        int id = (int) tableModel.getValueAt(modelRow, 0);
        Product p = ProductDAO.getProductById(id);
        if (p == null) {
            JOptionPane.showMessageDialog(this, "Product not found.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        if (!p.isAvailable()) {
            JOptionPane.showMessageDialog(this, "Unavailable products cannot be edited.", "Edit Restricted", JOptionPane.WARNING_MESSAGE);
            return;
        }
        openProductDialog(p);
    }

    private void markProduct() {
        int viewRow = productTable.getSelectedRow();
        if (viewRow < 0) {
            JOptionPane.showMessageDialog(this, "Select a product to mark availability.", "Warning",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        int modelRow = productTable.convertRowIndexToModel(viewRow);
        int id = (int) tableModel.getValueAt(modelRow, 0);
        hardwarehub_main.model.Product product = ProductDAO.getProductById(id);
        if (product == null) {
            JOptionPane.showMessageDialog(this, "Product not found.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        boolean currentlyAvailable = product.isAvailable();
        // Prevent re-enabling via UI unless restocked
        if (!currentlyAvailable && product.getQuantity() == 0) {
            JOptionPane.showMessageDialog(this, "Unavailable products can only be made available through restocking.", "Action Restricted", JOptionPane.WARNING_MESSAGE);
            return;
        }
        String actionText = currentlyAvailable ? "Mark this product as unavailable?" : "Mark this product as available?";
        int c = JOptionPane.showConfirmDialog(this, actionText,
                "Confirm", JOptionPane.YES_NO_OPTION);
        if (c == JOptionPane.YES_OPTION) {
            // If enabling, check if allowed
            if (!currentlyAvailable) {
                hardwarehub_main.model.Category cat = hardwarehub_main.dao.CategoryDAO.getCategoryById(product.getCategoryId());
                hardwarehub_main.model.Supplier sup = hardwarehub_main.dao.SupplierDAO.getSupplierById(product.getSupplierId());
                if ((cat != null && !cat.isAvailable()) || (sup != null && !sup.isAvailable())) {
                    JOptionPane.showMessageDialog(this, "Cannot mark as available: Category or Supplier is unavailable.\nPlease enable them first.", "Error", JOptionPane.ERROR_MESSAGE);
                    return;
                }
            }
            product.setAvailable(!currentlyAvailable);
            product.setUpdatedAt(java.time.LocalDateTime.now());
            // If marking unavailable, set quantity to 0
            if (currentlyAvailable == true) {
                product.setQuantity(0);
            }
            boolean success = ProductDAO.updateProduct(product);
            // --- Universal Audit log with seller name ---
            hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
            String sellerName = user != null ? user.getSellerName() : "Unknown";
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            String details = (product.isAvailable() ? "Marked product available: " : "Marked product unavailable: ") + product.getProductName() + " (ID: " + product.getProductId() + ") by " + sellerName;
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, now, success, "InventoryPanel", product.isAvailable() ? "Mark Available" : "Mark Unavailable", details));
            if (success) {
                JOptionPane.showMessageDialog(this, product.isAvailable() ? "Product marked as available." : "Product marked as unavailable.");
                loadProducts(null);
            } else {
                JOptionPane.showMessageDialog(this, "Failed to update product availability.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void openSupplierDialog(Supplier sup) {
        SupplierDialog dlg = new SupplierDialog(
                SwingUtilities.getWindowAncestor(this), sup
        );
        dlg.setVisible(true);
        if (dlg.isSucceeded()) {
            // optionally reload something
        }
    }

    private void showAllSuppliers() {
        String[] supplierColumns = {"Supplier ID", "Name", "Contact Name", "Contact Number", "Email", "Address", "Available"};
        tableModel.setDataVector(new Object[0][0], supplierColumns);
        java.util.List<hardwarehub_main.model.Supplier> suppliers = hardwarehub_main.dao.SupplierDAO.getAllSuppliers();
        for (hardwarehub_main.model.Supplier s : suppliers) {
            tableModel.addRow(new Object[]{
                s.getSupplierId(),
                s.getSupplierName(),
                s.getContactName(),
                s.getContactNumber(),
                s.getEmail(),
                s.getAddress(),
                Boolean.valueOf(s.isAvailable())
            });
        }
        // Set the 'Available' column to use checkboxes and be editable
        productTable.getColumnModel().getColumn(6).setCellEditor(new DefaultCellEditor(new JCheckBox()));
        productTable.getColumnModel().getColumn(6).setCellRenderer(productTable.getDefaultRenderer(Boolean.class));
        // Remove any custom cell renderers for color coding
        productTable.setDefaultRenderer(Object.class, new javax.swing.table.DefaultTableCellRenderer());
    }

    private void editSupplier() {
        // Show a dialog to select a supplier to edit
        java.util.List<hardwarehub_main.model.Supplier> suppliers = hardwarehub_main.dao.SupplierDAO.getAllSuppliers();
        if (suppliers.isEmpty()) {
            JOptionPane.showMessageDialog(this, "No suppliers to edit.");
            return;
        }
        String[] names = suppliers.stream().map(hardwarehub_main.model.Supplier::getSupplierName).toArray(String[]::new);
        String selected = (String) JOptionPane.showInputDialog(this, "Select supplier to edit:", "Edit Supplier", JOptionPane.PLAIN_MESSAGE, null, names, names[0]);
        if (selected == null) {
            return;
        }
        hardwarehub_main.model.Supplier sup = suppliers.stream().filter(s -> s.getSupplierName().equals(selected)).findFirst().orElse(null);
        if (sup == null) {
            return;
        }
        openSupplierDialog(sup);
        // Optionally refresh category/supplier panels if needed
        loadCategoryTree();
        loadProducts(null);
    }

    private void onImport() {
        ImportReportsDialog dlg = new ImportReportsDialog(SwingUtilities.getWindowAncestor(this));
        dlg.setVisible(true);
        // Optionally refresh table after import
        loadProducts(null);
    }

    private void onExport() {
        ExportReportsDialog dlg = new ExportReportsDialog(SwingUtilities.getWindowAncestor(this));
        dlg.setVisible(true);
    }

    private void onHelp() {
        StringBuilder sb = new StringBuilder();
        sb.append("INVENTORY PANEL HELP\n\n");
        sb.append("Purpose:\n");
        sb.append("- Manage all products, categories, and suppliers in your inventory.\n\n");
        sb.append("Main Processes:\n");
        sb.append("- Add, edit, or delete products, categories, and suppliers.\n");
        sb.append("- Import or export inventory data.\n");
        sb.append("- View, search, and filter products by category or keyword.\n");
        sb.append("- Monitor low stock and out-of-stock items.\n\n");
        sb.append("Ribbon & Menu Bar Buttons:\n");
        sb.append("- Add Product: Add a new product to inventory.\n");
        sb.append("- Edit Product: Edit details of the selected product.\n");
        sb.append("- Mark Product Unavailability: Marks the selected product as unavailable.\n");
        sb.append("- Add/Edit/Mark Category: Manage product categories.\n");
        sb.append("- Add/Edit/Mark Supplier: Manage suppliers.\n");
        sb.append("- Import Supplies: Import products or suppliers from file.\n");
        sb.append("- Export Report: Export inventory data.\n");
        sb.append("- Refresh Table: Reload product list.\n");
        sb.append("- Help: Show this help dialog.\n\n");
        sb.append("Keyboard Shortcuts:\n");
        sb.append("- Back: Alt+Left\n");
        sb.append("- Refresh Table: Ctrl+R\n");
        sb.append("- Add Product: Ctrl+Shift+A\n");
        sb.append("- Edit Product: Ctrl+Shift+E\n");
        sb.append("- Mark Product Unavailability: Ctrl+Shift+U\n");
        sb.append("- Add Category: Ctrl+Alt+Shift+A\n");
        sb.append("- Mark Category Availability: Ctrl+Alt+Shift+U\n");
        sb.append("- Add Supplier: Ctrl+Alt+A\n");
        sb.append("- Edit Supplier: Ctrl+Alt+E\n");
        sb.append("- Mark Supplier: Ctrl+Alt+U\n");
        sb.append("- Import Supplies: Ctrl+O\n");
        sb.append("- Export Report: Ctrl+S\n");
        sb.append("- Help: Ctrl+H\n");
        sb.append("- Exit: Escape\n\n");
        sb.append("Developed by: JCBP Solutions © 2025\nHardwareHub v1.0");
        JOptionPane.showMessageDialog(this, sb.toString(), "Inventory Help", JOptionPane.INFORMATION_MESSAGE);
    }

    // --- Category Add/Mark Logic ---
    private void onAddCategory() {
        JPanel panel = new JPanel(new GridLayout(0, 1, 5, 5));
        JTextField tfName = new JTextField(20);
        java.util.List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
        JComboBox<String> cbParent = new JComboBox<>();
        cbParent.addItem("<No Parent>");
        java.util.Map<String, Integer> nameToId = new java.util.HashMap<>();
        // Helper to build indented names
        java.util.function.BiConsumer<java.util.List<hardwarehub_main.model.Category>, Integer> addIndented = new java.util.function.BiConsumer<>() {
            @Override
            public void accept(java.util.List<hardwarehub_main.model.Category> cats, Integer level) {
                for (hardwarehub_main.model.Category cat : cats) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < level; i++) {
                        sb.append("    ");
                    }
                    sb.append(cat.getCategory());
                    cbParent.addItem(sb.toString());
                    nameToId.put(sb.toString(), cat.getCategoryId());
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
        // Add root categories
        java.util.List<hardwarehub_main.model.Category> roots = new java.util.ArrayList<>();
        for (hardwarehub_main.model.Category c : categories) {
            if (c.getParentCategoryId() == null) {
                roots.add(c);
            }
        }
        addIndented.accept(roots, 0);
        panel.add(new JLabel("Category Name:"));
        panel.add(tfName);
        panel.add(new JLabel("Parent Category:"));
        panel.add(cbParent);
        int result = JOptionPane.showConfirmDialog(this, panel, "Add Category", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (result == JOptionPane.OK_OPTION) {
            String name = tfName.getText().trim();
            if (!name.isEmpty()) {
                hardwarehub_main.model.Category cat = new hardwarehub_main.model.Category();
                cat.setCategory(name);
                int selIdx = cbParent.getSelectedIndex();
                if (selIdx > 0) {
                    String selName = (String) cbParent.getSelectedItem();
                    cat.setParentCategoryId(nameToId.get(selName));
                } else {
                    cat.setParentCategoryId(null);
                }
                cat.setAvailable(true);
                cat.setCreatedAt(java.time.LocalDateTime.now());
                cat.setUpdatedAt(java.time.LocalDateTime.now());
                if (hardwarehub_main.dao.CategoryDAO.insertCategory(cat)) {
                    JOptionPane.showMessageDialog(this, "Category added successfully.");
                    loadCategoryTree();
                } else {
                    JOptionPane.showMessageDialog(this, "Failed to add category.", "Error", JOptionPane.ERROR_MESSAGE);
                }
            }
        }
    }

    // --- Bulk Marking for Categories ---
    private void bulkMarkCategories() {
        java.util.List<hardwarehub_main.model.Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
        if (categories.isEmpty()) {
            JOptionPane.showMessageDialog(this, "No categories to mark.");
            return;
        }
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        java.util.List<JCheckBox> checkBoxes = new java.util.ArrayList<>();
        java.util.Map<Integer, JCheckBox> parentCategoryCheckBoxMap = new java.util.HashMap<>();
        java.util.Map<Integer, java.util.List<JCheckBox>> parentToChildCheckBoxMap = new java.util.HashMap<>();
        java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory = new java.util.HashMap<>();
        for (hardwarehub_main.model.Category c : categories) {
            idToCategory.put(c.getCategoryId(), c);
        }
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
                    JCheckBox cb = new JCheckBox(sb.toString(), cat.isAvailable());
                    checkBoxes.add(cb);
                    panel.add(cb);
                    if (parentToChildren.containsKey(cat.getCategoryId())) {
                        parentCategoryCheckBoxMap.put(cat.getCategoryId(), cb);
                        java.util.List<JCheckBox> children = new java.util.ArrayList<>();
                        parentToChildCheckBoxMap.put(cat.getCategoryId(), children);
                        for (hardwarehub_main.model.Category child : parentToChildren.get(cat.getCategoryId())) {
                            JCheckBox childCb = new JCheckBox("    " + child.getCategory(), child.isAvailable());
                            checkBoxes.add(childCb);
                            panel.add(childCb);
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
        int result = JOptionPane.showConfirmDialog(this, new JScrollPane(panel), "Bulk Mark Categories (Available/Unavailable)", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (result == JOptionPane.OK_OPTION) {
            CategoryBulkMarker.bulkMarkCategories(categories, checkBoxes, this);
            loadCategoryTree();
            loadProducts(null);
        }
    }

    // --- Bulk Marking for Suppliers ---
    private void bulkMarkSuppliers() {
        java.util.List<hardwarehub_main.model.Supplier> suppliers = hardwarehub_main.dao.SupplierDAO.getAllSuppliers();
        if (suppliers.isEmpty()) {
            JOptionPane.showMessageDialog(this, "No suppliers to mark.");
            return;
        }
        JPanel panel = new JPanel(new GridLayout(0, 1));
        java.util.List<JCheckBox> checkBoxes = new java.util.ArrayList<>();
        for (hardwarehub_main.model.Supplier sup : suppliers) {
            JCheckBox cb = new JCheckBox(sup.getSupplierName(), sup.isAvailable());
            checkBoxes.add(cb);
            panel.add(cb);
        }
        int result = JOptionPane.showConfirmDialog(this, new JScrollPane(panel), "Bulk Mark Suppliers (Available/Unavailable)", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (result == JOptionPane.OK_OPTION) {
            hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
            String sellerName = user != null ? user.getSellerName() : "Unknown";
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            int prodChanged = 0;
            for (int i = 0; i < suppliers.size(); i++) {
                hardwarehub_main.model.Supplier sup = suppliers.get(i);
                boolean newAvail = checkBoxes.get(i).isSelected();
                if (sup.isAvailable() != newAvail) {
                    sup.setAvailable(newAvail);
                    boolean success = hardwarehub_main.dao.SupplierDAO.updateSupplier(sup);
                    String details = (sup.isAvailable() ? "Bulk marked supplier available: " : "Bulk marked supplier unavailable: ") + sup.getSupplierName() + " (ID: " + sup.getSupplierId() + ") by " + sellerName;
                    hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, now, success, "InventoryPanel", sup.isAvailable() ? "Bulk Mark Available" : "Bulk Mark Unavailable", details));
                    // Update all products for this supplier
                    java.util.List<hardwarehub_main.model.Product> products = hardwarehub_main.dao.ProductDAO.getAllProducts();
                    for (hardwarehub_main.model.Product p : products) {
                        if (p.getSupplierId() == sup.getSupplierId()) {
                            boolean oldAvail = p.isAvailable();
                            if (sup.isAvailable()) {
                                // Only enable if category is available
                                hardwarehub_main.model.Category cat = hardwarehub_main.dao.CategoryDAO.getCategoryById(p.getCategoryId());
                                if (cat != null && cat.isAvailable()) {
                                    p.setAvailable(true);
                                } else {
                                    continue;
                                }
                            } else {
                                p.setAvailable(false);
                                p.setQuantity(0); // Set quantity to 0 when marking unavailable
                            }
                            if (oldAvail != p.isAvailable()) {
                                p.setUpdatedAt(now);
                                boolean prodSuccess = hardwarehub_main.dao.ProductDAO.updateProduct(p);
                                String prodDetails = (p.isAvailable() ? "Bulk marked product available: " : "Bulk marked product unavailable: ") + p.getProductName() + " (ID: " + p.getProductId() + ") by " + sellerName + " (Supplier: " + sup.getSupplierName() + ")";
                                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, now, prodSuccess, "InventoryPanel", p.isAvailable() ? "Bulk Mark Available" : "Bulk Mark Unavailable", prodDetails));
                                prodChanged++;
                            }
                        }
                    }
                }
            }
            showAllSuppliers(); // Stay in suppliers view after bulk mark
            JOptionPane.showMessageDialog(this, "Bulk marking complete. Suppliers changed: " + suppliers.size() + ", Products changed: " + prodChanged + ".");
        }
    }

    // --- Enhanced Filters ---
    private void addEnhancedFilters() {
        filterPanel = new JPanel();
        filterPanel.setBackground(UIConstants.PANEL_BG);
        filterPanel.setLayout(new BoxLayout(filterPanel, BoxLayout.X_AXIS));
        filterPanel.setBorder(new EmptyBorder(5, 10, 5, 10));

        cbSupplierFilter = new JComboBox<>();
        cbSupplierFilter.addItem("All Suppliers");
        for (String s : hardwarehub_main.dao.SupplierDAO.getAllSupplierNames()) {
            cbSupplierFilter.addItem(s);
        }
        cbSupplierFilter.addActionListener(e -> filterProducts());
        filterPanel.add(new JLabel("Supplier: "));
        filterPanel.add(cbSupplierFilter);

        cbLowStock = new JCheckBox("Low Stock");
        cbLowStock.addActionListener(e -> filterProducts());
        filterPanel.add(cbLowStock);

        cbNoStock = new JCheckBox("No Stock");
        cbNoStock.addActionListener(e -> filterProducts());
        filterPanel.add(cbNoStock);

        cbAvailableOnly = new JCheckBox("Available Only");
        cbAvailableOnly.addActionListener(e -> filterProducts());
        filterPanel.add(cbAvailableOnly);

        cbUnavailableOnly = new JCheckBox("Unavailable Only");
        cbUnavailableOnly.addActionListener(e -> filterProducts());
        filterPanel.add(cbUnavailableOnly);

        cbFastMoving = new JCheckBox("Fast-Moving Inventory");
        cbFastMoving.addActionListener(e -> filterProducts());
        filterPanel.add(cbFastMoving);

        cbMultiSupplier = new JCheckBox("Multi-Supplier");
        cbMultiSupplier.addActionListener(e -> filterProducts());
        filterPanel.add(cbMultiSupplier);
    }

    private String getIndentedCategoryName(hardwarehub_main.model.Category cat, java.util.Map<Integer, hardwarehub_main.model.Category> idToCategory) {
        StringBuilder sb = new StringBuilder();
        int depth = 0;
        Integer parentId = cat.getParentCategoryId();
        while (parentId != null && idToCategory.containsKey(parentId)) {
            depth++;
            parentId = idToCategory.get(parentId).getParentCategoryId();
        }
        for (int i = 0; i < depth; i++) {
            sb.append("    ");
        }
        sb.append(cat.getCategory());
        return sb.toString();
    }

    public static void main(String[] args) {
        // Ensure UI creation on EDT
        SwingUtilities.invokeLater(() -> {
            SubstanceCortex.GlobalScope.setSkin(new BusinessBlueSteelSkin());

            // Create frame
            JFrame frame = new JFrame("HardwareHub Inventory");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(1650, 1000);
            frame.setLocationRelativeTo(null);

            // Optionally set app icon
            ImageIcon logo = IconUtil.loadIcon("HardwareHub_Icon.png");
            frame.setIconImage(logo.getImage());

            // Create and add InventoryPanel
            InventoryPanel panel = new InventoryPanel();
            frame.setJMenuBar(panel.createMenuBar());
            frame.setContentPane(panel);

            // Register keyboard shortcuts
            panel.registerKeyBindings(frame.getRootPane());

            frame.revalidate();
            frame.repaint();
        });
    }
}
