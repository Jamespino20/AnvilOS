package hardwarehub_main.gui.dashboard;

import hardwarehub_main.model.User;
import hardwarehub_main.gui.inventory.InventoryPanel;
import hardwarehub_main.gui.transaction.StockMovementsPanel;
import hardwarehub_main.gui.pos.POSPanel;
import hardwarehub_main.util.IconUtil;
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import org.pushingpixels.substance.api.SubstanceCortex;
import org.pushingpixels.substance.api.skin.BusinessBlueSteelSkin;
import hardwarehub_main.dao.ProductDAO;
import hardwarehub_main.dao.NotificationDAO;
import hardwarehub_main.model.Product;
import hardwarehub_main.model.Notification;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartPanel;
import org.jfree.chart.JFreeChart;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.PiePlot;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import hardwarehub_main.dao.UserDAO;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Set;
import javax.swing.table.DefaultTableModel;
import java.util.function.Supplier; // Import Supplier for use with NotificationsDialog
import hardwarehub_login.LoaderDialog;
import javax.swing.SwingWorker;

public class DashboardPanel extends JPanel {

    private JFrame parentFrame;
    private JLabel lblGreeting;
    private JButton btnAccount;
    private JPopupMenu accountMenu;
    private User currentUser;
    private JButton btnNotifications; // Declare this at the class level
    // Glass pane loader overlay
    private JPanel loaderPane = null;

    public DashboardPanel(JFrame parentFrame) {
        this.parentFrame = parentFrame;
        this.currentUser = User.getCurrentUser();
        // Ensure Substance LAF is applied
        try {
            org.pushingpixels.substance.api.SubstanceCortex.GlobalScope.setSkin(new org.pushingpixels.substance.api.skin.BusinessBlueSteelSkin());
        } catch (Exception ignore) {
        }
        setLayout(new BorderLayout());
        if (parentFrame != null) {
            parentFrame.setJMenuBar(null);
        }

        // --- Call notification creation on dashboard load ---
        checkAndCreateStockNotifications();
        checkAndCreateOngoingTransactionNotifications();

        // Sidebar (left)
        JPanel sidebar = new JPanel();
        sidebar.setBackground(new Color(180, 200, 240)); // Light blue
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setPreferredSize(new Dimension(370, 0));
        sidebar.setBorder(BorderFactory.createEmptyBorder(24, 0, 24, 0));

        // Logo at top
        ImageIcon logoIcon = hardwarehub_main.util.IconUtil.loadIcon("HardwareHub_Logo.png");
        int logoWidth = 160;
        int logoHeight = logoIcon.getIconHeight() * logoWidth / logoIcon.getIconWidth();
        Image scaledLogo = logoIcon.getImage().getScaledInstance(logoWidth, logoHeight, Image.SCALE_SMOOTH);
        JLabel logoLabel = new JLabel(new ImageIcon(scaledLogo));
        logoLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        logoLabel.setBorder(BorderFactory.createEmptyBorder(0, 0, 32, 0));
        sidebar.add(logoLabel);

        // Sidebar buttons (wider)
        sidebar.add(makeSidebarButton("Inventory", "Dashboard/InventoryButton.png", () -> switchToPanelWithLoader(new hardwarehub_main.gui.inventory.InventoryPanel())));
        sidebar.add(Box.createVerticalStrut(12));
        sidebar.add(makeSidebarButton("POS", "Dashboard/POSButton.png", () -> switchToPanelWithLoader(new hardwarehub_main.gui.pos.POSPanel())));
        sidebar.add(Box.createVerticalStrut(12));
        sidebar.add(makeSidebarButton("Stock Movements", "Dashboard/StocksTrackButton.png", () -> switchToPanelWithLoader(new hardwarehub_main.gui.transaction.StockMovementsPanel())));
        sidebar.add(Box.createVerticalStrut(12));
        sidebar.add(makeSidebarButton("Audit Log", "Dashboard/AuditLogButton.png", () -> {
            switchToPanelWithLoader(new hardwarehub_main.gui.auditlog.AuditLogPanel(parentFrame));
            hardwarehub_main.gui.auditlog.AuditLogPanel.ensureMenuBar(parentFrame);
        }));
        sidebar.add(Box.createVerticalStrut(12));
        // Notification button - Initialize it here
        btnNotifications = createNotificationButton(); // New method to create and initialize
        sidebar.add(btnNotifications);
        sidebar.add(Box.createVerticalGlue());

        add(sidebar, BorderLayout.WEST);

        // Main content area with background and glass overlay
        JPanel bgPanel = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Image bg = hardwarehub_main.util.IconUtil.loadIcon("Background.jpg").getImage();
                g.drawImage(bg, 0, 0, getWidth(), getHeight(), this);
            }
        };
        bgPanel.setOpaque(false);
        bgPanel.setLayout(new GridBagLayout());
        add(bgPanel, BorderLayout.CENTER);

        // --- Top bar for greeting and account icon ---
        JPanel topBar = new JPanel();
        topBar.setOpaque(false);
        topBar.setLayout(new BoxLayout(topBar, BoxLayout.X_AXIS));
        topBar.setBorder(BorderFactory.createEmptyBorder(8, 8, 8, 8));
        topBar.add(Box.createHorizontalGlue());
        // Greeting
        String userName = currentUser != null ? currentUser.getSellerName() : "User";
        lblGreeting = new JLabel("Hello, " + userName + "!");
        lblGreeting.setFont(new Font("Arial", Font.BOLD, 18));
        lblGreeting.setForeground(new Color(40, 44, 55));
        topBar.add(lblGreeting);
        topBar.add(Box.createHorizontalStrut(12));
        // Account icon button
        ImageIcon accIcon = hardwarehub_main.util.IconUtil.loadIcon("Dashboard/AccountIcon.png");
        Image accImg = accIcon.getImage().getScaledInstance(36, 36, Image.SCALE_SMOOTH);
        btnAccount = new JButton(new ImageIcon(accImg));
        btnAccount.setPreferredSize(new Dimension(44, 44));
        btnAccount.setFocusPainted(false);
        btnAccount.setContentAreaFilled(false);
        btnAccount.setBorderPainted(false);
        btnAccount.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        btnAccount.setToolTipText("Account Menu");
        btnAccount.addActionListener(e -> showAccountMenu(btnAccount));
        topBar.add(btnAccount);
        // Add topBar to bgPanel (GridBag)
        GridBagConstraints gbcTop = new GridBagConstraints();
        gbcTop.gridx = 0;
        gbcTop.gridy = 0;
        gbcTop.weightx = 1.0;
        gbcTop.fill = GridBagConstraints.HORIZONTAL;
        gbcTop.anchor = GridBagConstraints.NORTHEAST;
        bgPanel.add(topBar, gbcTop);

        // --- Glass overlay (main content) ---
        JPanel glass = new JPanel();
        glass.setOpaque(false);
        glass.setLayout(new BoxLayout(glass, BoxLayout.Y_AXIS));
        glass.setBorder(BorderFactory.createEmptyBorder(24, 24, 24, 24));
        glass.setBackground(new Color(255, 255, 255, 200));
        glass.setAlignmentX(Component.CENTER_ALIGNMENT);

        // Top stats row
        JPanel statsRow = new JPanel();
        statsRow.setOpaque(false);
        statsRow.setLayout(new BoxLayout(statsRow, BoxLayout.X_AXIS));
        statsRow.add(makeStatBox("Cumulative Sales", getCumulativeSales()));
        statsRow.add(Box.createHorizontalStrut(24));
        statsRow.add(makeStatBox("Total Buyers", getTotalBuyers()));
        statsRow.add(Box.createHorizontalStrut(24));
        statsRow.add(makeStatBox("Total Sellers", getTotalSellers()));
        statsRow.setMaximumSize(new Dimension(1200, 80));
        glass.add(statsRow);
        glass.add(Box.createVerticalStrut(18));

        // Recent transactions table
        glass.add(makeRecentTransactionsPanel());
        glass.add(Box.createVerticalStrut(18));

        // Graphs grid
        JPanel graphsGrid = new JPanel(new GridLayout(1, 2, 24, 0));
        graphsGrid.setOpaque(false);
        graphsGrid.setMaximumSize(new Dimension(1200, 260));
        graphsGrid.add(createSalesOverTimeChartCard());
        graphsGrid.add(createTransactionsByStatusChartCard());
        glass.add(graphsGrid);
        glass.add(Box.createVerticalStrut(18));

        // Stock alerts
        glass.add(makeStockAlertsPanel());

        // White glass effect
        JPanel glassBg = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setColor(new Color(255, 255, 255, 120)); // Lower opacity for more background visibility
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 32, 32);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        glassBg.setOpaque(false);
        glassBg.setLayout(new BorderLayout());
        glassBg.add(glass, BorderLayout.CENTER);
        glassBg.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 0));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.gridx = 0;
        gbc.gridy = 1; // below topBar
        gbc.weightx = 1.0;
        gbc.weighty = 1.0;
        gbc.fill = GridBagConstraints.BOTH;
        gbc.anchor = GridBagConstraints.CENTER;
        bgPanel.add(glassBg, gbc);

        // --- Window close prompt logic ---
        if (parentFrame != null) {
            parentFrame.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
            for (WindowListener wl : parentFrame.getWindowListeners()) {
                parentFrame.removeWindowListener(wl);
            }
            parentFrame.addWindowListener(new WindowAdapter() {
                @Override
                public void windowClosing(WindowEvent e) {
                    int result = JOptionPane.showOptionDialog(parentFrame,
                            "What would you like to do?",
                            "Exit Options",
                            JOptionPane.DEFAULT_OPTION,
                            JOptionPane.QUESTION_MESSAGE,
                            null,
                            new String[]{"Logout", "Exit", "Cancel"},
                            "Logout");
                    if (result == 0) { // Logout
                        if (currentUser != null) {
                            UserDAO.updateUserActiveStatus(currentUser.getSellerId(), 0); // Set inactive
                        }
                        User.setCurrentUser(null);
                        parentFrame.dispose();
                        hardwarehub_login.LoginFrame.main(new String[0]);
                    } else if (result == 1) { // Exit
                        if (currentUser != null) {
                            UserDAO.updateUserActiveStatus(currentUser.getSellerId(), 0); // Set inactive
                        }
                        System.exit(0);
                    } // else Cancel: do nothing
                }
            });
        }
        updateNotificationButtonIcon(); // Initial icon update
    }

    private JButton makeSidebarButton(String text, String iconPath, Runnable action) {
        ImageIcon icon = hardwarehub_main.util.IconUtil.loadIcon(iconPath);
        Image img = icon.getImage().getScaledInstance(36, 36, Image.SCALE_SMOOTH);
        JButton btn = new JButton(text, new ImageIcon(img));
        btn.setAlignmentX(Component.CENTER_ALIGNMENT);
        btn.setMaximumSize(new Dimension(290, 54)); // Wider and taller
        btn.setFont(new Font("Arial", Font.BOLD, 18));
        btn.setForeground(Color.BLACK);
        btn.setBackground(new Color(40, 44, 55));
        btn.setFocusPainted(false);
        btn.setBorder(BorderFactory.createEmptyBorder(8, 24, 8, 24));
        btn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        btn.setHorizontalAlignment(SwingConstants.LEFT);
        btn.setIconTextGap(16);
        btn.addActionListener(e -> action.run());
        btn.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseEntered(java.awt.event.MouseEvent evt) {
                btn.setBackground(new Color(60, 64, 85));
            }

            public void mouseExited(java.awt.event.MouseEvent evt) {
                btn.setBackground(new Color(40, 44, 55));
            }
        });
        return btn;
    }

    // Create the notification button and set its initial icon
    private JButton createNotificationButton() {
        JButton btn = new JButton("Notifications");
        btn.setAlignmentX(Component.CENTER_ALIGNMENT);
        btn.setMaximumSize(new Dimension(290, 54));
        btn.setFont(new Font("Arial", Font.BOLD, 18));
        btn.setForeground(Color.BLACK);
        btn.setBackground(new Color(40, 44, 55));
        btn.setFocusPainted(false);
        btn.setBorder(BorderFactory.createEmptyBorder(8, 24, 8, 24));
        btn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        btn.setHorizontalAlignment(SwingConstants.LEFT);
        btn.setIconTextGap(16);
        btn.addActionListener(e -> showNotificationsDialog());
        btn.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseEntered(java.awt.event.MouseEvent evt) {
                btn.setBackground(new Color(60, 64, 85));
            }

            public void mouseExited(java.awt.event.MouseEvent evt) {
                btn.setBackground(new Color(40, 44, 55));
            }
        });
        return btn;
    }

    private void checkAndCreateStockNotifications() {
        List<Product> products = ProductDAO.getAllProducts();
        for (Product p : products) {
            // No Stock
            if (p.getQuantity() == 0) {
                String sysNotif = "Stock_" + p.getProductId();
                String msg = "NO STOCK: " + p.getProductName() + " is out of stock!";
                if (!NotificationDAO.notificationExists(sysNotif, msg)) {
                    Notification notif = new Notification(sysNotif, msg, false, LocalDateTime.now());
                    NotificationDAO.addNotification(notif);
                }
            } // Low Stock
            else if (p.getQuantity() <= p.getMinThreshold()) {
                String sysNotif = "Stock_" + p.getProductId();
                String msg = "LOW STOCK: " + p.getProductName() + " quantity is " + p.getQuantity() + " (threshold: " + p.getMinThreshold() + ")";
                if (!NotificationDAO.notificationExists(sysNotif, msg)) {
                    Notification notif = new Notification(sysNotif, msg, false, LocalDateTime.now());
                    NotificationDAO.addNotification(notif);
                }
            }
        }
    }

    private void checkAndCreateOngoingTransactionNotifications() {
        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        for (hardwarehub_main.model.Transaction txn : txns) {
            if ("Ongoing".equalsIgnoreCase(txn.getTransactionStatus())) {
                String sysNotif = "Transaction_" + txn.getTransactionId();
                String msg = "Ongoing transaction: #" + txn.getTransactionId() + " with " + txn.getBuyerName();
                if (!NotificationDAO.notificationExists(sysNotif, msg)) {
                    Notification notif = new Notification(sysNotif, msg, false, txn.getTransactionDate() != null
                            ? txn.getTransactionDate().atStartOfDay() : LocalDateTime.now());
                    NotificationDAO.addNotification(notif);
                }
            }
        }
    }

    // Updates the icon and label for the notification button
    private void updateNotificationButtonIcon() {
        int notifCount = NotificationDAO.getUnreadCount();
        String iconFileName = "Notifications/Notif_" + Math.min(notifCount, 10) + ".png";
        ImageIcon icon = hardwarehub_main.util.IconUtil.loadIcon(iconFileName);

        if (icon != null) {
            Image img = icon.getImage().getScaledInstance(36, 36, Image.SCALE_SMOOTH);
            btnNotifications.setIcon(new ImageIcon(img));
        } else {
            btnNotifications.setIcon(null);
        }

        btnNotifications.setText("Notifications (" + notifCount + ")");
        btnNotifications.revalidate();
        btnNotifications.repaint();
    }

    // Combine persistent and dynamic notifications
    private List<Notification> getAllCurrentNotifications() {
        List<Notification> dbNotifications = NotificationDAO.getAllNotifications();
        List<Notification> all = new ArrayList<>(dbNotifications);

        Set<String> existingMessages = dbNotifications.stream()
                .map(Notification::getMessage)
                .collect(Collectors.toSet());

        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        for (hardwarehub_main.model.Transaction txn : txns) {
            if ("Ongoing".equalsIgnoreCase(txn.getTransactionStatus())) {
                String message = "Ongoing transaction: #" + txn.getTransactionId() + " with " + txn.getBuyerName();
                if (!existingMessages.contains(message)) {
                    all.add(new Notification(
                            "Transaction_" + txn.getTransactionId(),
                            message,
                            false,
                            txn.getTransactionDate() != null ? txn.getTransactionDate().atStartOfDay() : LocalDateTime.now()
                    ));
                }
            }
        }
        List<hardwarehub_main.model.Product> products = hardwarehub_main.dao.ProductDAO.getAllProducts();
        for (hardwarehub_main.model.Product p : products) {
            if (p.getQuantity() == 0) {
                String message = "NO STOCK: " + p.getProductName() + " is out of stock!";
                if (!existingMessages.contains(message)) {
                    all.add(new Notification(
                            "Stock_" + p.getProductId(),
                            message,
                            false,
                            LocalDateTime.now()
                    ));
                }
            } else if (p.getQuantity() <= p.getMinThreshold()) {
                String message = "LOW STOCK: " + p.getProductName() + " quantity is " + p.getQuantity() + " (threshold: " + p.getMinThreshold() + ")";
                if (!existingMessages.contains(message)) {
                    all.add(new Notification(
                            "Stock_" + p.getProductId(),
                            message,
                            false,
                            LocalDateTime.now()
                    ));
                }
            }
        }
        all.sort((n1, n2) -> n2.getCreatedAt().compareTo(n1.getCreatedAt()));
        return all;
    }

    // Count unread (DB + dynamic) notifications
    private int getFullUnreadNotificationCount() {
        return (int) getAllCurrentNotifications().stream()
                .filter(n -> !n.isRead())
                .count();
    }

    // Show the notifications dialog and handle interaction logic
    private void showNotificationsDialog() {
        NotificationsDialog dialog = new NotificationsDialog(parentFrame,
                NotificationDAO::getUnreadNotifications, // Only unread DB notifications!
                notif -> {
                    // Only persistent notifications exist now
                    NotificationDAO.markAsRead(notif.getNotificationID());
                    updateNotificationButtonIcon();

                    // Optional: Navigate to relevant panel
                    if (notif.getMessage().startsWith("Ongoing transaction")) {
                        SwingUtilities.invokeLater(() -> switchToPanel(new hardwarehub_main.gui.transaction.StockMovementsPanel()));
                    } else if (notif.getMessage().startsWith("NO STOCK") || notif.getMessage().startsWith("LOW STOCK")) {
                        SwingUtilities.invokeLater(() -> switchToPanel(new hardwarehub_main.gui.inventory.InventoryPanel()));
                    }
                },
                () -> {
                    NotificationDAO.markAllAsRead();
                    updateNotificationButtonIcon();
                }
        );
        dialog.setVisible(true);
        updateNotificationButtonIcon();
    }

    private void showAccountMenu(Component anchor) {
        if (accountMenu == null) {
            accountMenu = new JPopupMenu();
            JMenuItem logout = new JMenuItem("Logout");
            logout.addActionListener(e -> {
                if (currentUser != null) {
                    hardwarehub_main.dao.UserDAO.updateUserActiveStatus(currentUser.getSellerId(), 0); // Set inactive
                }
                hardwarehub_main.model.User.setCurrentUser(null);
                SwingUtilities.getWindowAncestor(this).dispose();
                new hardwarehub_login.LoginFrame().setVisible(true);
            });
            JMenuItem delete = new JMenuItem("Delete Account");
            delete.addActionListener(e -> {
                int confirm = JOptionPane.showConfirmDialog(this,
                        "Are you sure you want to delete your account? This action cannot be undone.",
                        "Confirm Account Deletion",
                        JOptionPane.YES_NO_OPTION,
                        JOptionPane.WARNING_MESSAGE);
                if (confirm == JOptionPane.YES_OPTION && currentUser != null) {
                    String input = JOptionPane.showInputDialog(this,
                            "To permanently delete your account, please type 'DELETE' below:",
                            "Confirm Deletion",
                            JOptionPane.WARNING_MESSAGE);
                    if (input != null && input.equals("DELETE")) {
                        if (hardwarehub_main.dao.UserDAO.updateUserActiveStatus(currentUser.getSellerId(), -1)) { // Mark as deleted (soft-delete)
                            JOptionPane.showMessageDialog(this, "Your account has been successfully deleted.", "Account Deleted", JOptionPane.INFORMATION_MESSAGE);
                            hardwarehub_main.model.User.setCurrentUser(null);
                            SwingUtilities.getWindowAncestor(this).dispose();
                            new hardwarehub_login.LoginFrame().setVisible(true);
                        } else {
                            JOptionPane.showMessageDialog(this, "Failed to delete account. Please try again.", "Error", JOptionPane.ERROR_MESSAGE);
                        }
                    } else if (input != null) { // User typed something but it wasn't "DELETE"
                        JOptionPane.showMessageDialog(this, "Deletion cancelled. You did not type 'DELETE' correctly.", "Cancellation", JOptionPane.INFORMATION_MESSAGE);
                    } else { // User clicked Cancel on the input dialog
                        JOptionPane.showMessageDialog(this, "Account deletion cancelled.", "Cancellation", JOptionPane.INFORMATION_MESSAGE);
                    }
                }
            });
            JMenuItem cancel = new JMenuItem("Cancel");
            cancel.addActionListener(e -> accountMenu.setVisible(false));
            accountMenu.add(logout);
            accountMenu.add(delete);
            accountMenu.addSeparator();
            accountMenu.add(cancel);
        }
        accountMenu.show(anchor, 0, anchor.getHeight());
    }

    private JPanel createSalesOverTimeChartCard() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(70, 130, 180), 2, true),
                BorderFactory.createEmptyBorder(10, 10, 10, 10)));
        JLabel titleLabel = new JLabel("Cumulative Sales Over Time", SwingConstants.CENTER);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 20));
        titleLabel.setForeground(new Color(70, 130, 180));
        panel.add(titleLabel, BorderLayout.NORTH);
        // Build dataset
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        java.util.Map<String, java.math.BigDecimal> dateToSales = new java.util.TreeMap<>();
        for (hardwarehub_main.model.Transaction t : txns) {
            if (t == null || t.getTransactionStatus() == null || t.getTransactionType() == null) {
                continue;
            }
            if (!"Completed".equalsIgnoreCase(t.getTransactionStatus())) {
                continue;
            }
            String type = t.getTransactionType();
            String date = t.getTransactionDate() != null ? t.getTransactionDate().toString() : "?";
            dateToSales.putIfAbsent(date, java.math.BigDecimal.ZERO);
            if ("Sale Walk-In".equalsIgnoreCase(type) || "Sale PO".equalsIgnoreCase(type)) {
                dateToSales.put(date, dateToSales.get(date).add(t.getGrandTotal()));
            } else if ("Return".equalsIgnoreCase(type)) {
                dateToSales.put(date, dateToSales.get(date).subtract(t.getGrandTotal()));
            }
        }
        java.math.BigDecimal cumulative = java.math.BigDecimal.ZERO;
        boolean hasData = false;
        for (String date : dateToSales.keySet()) {
            cumulative = cumulative.add(dateToSales.get(date));
            dataset.addValue(cumulative, "Sales", date);
            hasData = true;
        }
        if (!hasData) {
            // Show a zero line for today if no data
            String today = java.time.LocalDate.now().toString();
            dataset.addValue(java.math.BigDecimal.ZERO, "Sales", today);
        }
        JFreeChart chart = ChartFactory.createLineChart(
                null, "Date", "₱ Sales", dataset, PlotOrientation.VERTICAL, false, false, false);
        chart.setBackgroundPaint(new Color(245, 250, 255));
        chart.getPlot().setBackgroundPaint(new Color(230, 240, 250));
        ChartPanel chartPanel = new ChartPanel(chart);
        chartPanel.setOpaque(false);
        panel.add(chartPanel, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createTransactionsByStatusChartCard() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(70, 130, 180), 2, true),
                BorderFactory.createEmptyBorder(10, 10, 10, 10)));
        JLabel titleLabel = new JLabel("Transactions by Status", SwingConstants.CENTER);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 20));
        titleLabel.setForeground(new Color(70, 130, 180));
        panel.add(titleLabel, BorderLayout.NORTH);
        DefaultPieDataset<String> dataset = new DefaultPieDataset<>();
        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        long ongoing = txns.stream().filter(t -> "Ongoing".equalsIgnoreCase(t.getTransactionStatus())).count();
        long completed = txns.stream().filter(t -> "Completed".equalsIgnoreCase(t.getTransactionStatus())).count();
        long cancelled = txns.stream().filter(t -> "Cancelled".equalsIgnoreCase(t.getTransactionStatus())).count();
        dataset.setValue("Ongoing", ongoing);
        dataset.setValue("Completed", completed);
        dataset.setValue("Cancelled", cancelled);
        JFreeChart chart = ChartFactory.createPieChart(
                null, dataset, false, false, false);
        chart.setBackgroundPaint(new Color(245, 250, 255));
        PiePlot plot = (PiePlot) chart.getPlot();
        plot.setBackgroundPaint(new Color(230, 240, 250));
        plot.setSectionPaint("Ongoing", new Color(70, 130, 180));
        plot.setSectionPaint("Completed", new Color(60, 180, 75));
        plot.setSectionPaint("Cancelled", new Color(220, 50, 47));
        ChartPanel chartPanel = new ChartPanel(chart);
        chartPanel.setOpaque(false);
        panel.add(chartPanel, BorderLayout.CENTER);
        return panel;
    }

    private JPanel makeStockAlertsPanel() {
        JPanel outer = new JPanel(new BorderLayout());
        outer.setOpaque(false);
        outer.setBorder(BorderFactory.createEmptyBorder(8, 0, 8, 0));
        JPanel box = new JPanel();
        box.setOpaque(true);
        box.setBackground(new Color(255, 255, 255, 180));
        box.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(180, 60, 60, 180), 2, true),
                BorderFactory.createEmptyBorder(12, 18, 12, 18)));
        box.setLayout(new BoxLayout(box, BoxLayout.Y_AXIS));
        JLabel title = new JLabel("Stock Alerts");
        title.setFont(new Font("Arial", Font.BOLD, 18));
        title.setForeground(new Color(180, 60, 60));
        box.add(title);
        JPanel alertsPanel = new JPanel();
        alertsPanel.setOpaque(false);
        alertsPanel.setLayout(new BoxLayout(alertsPanel, BoxLayout.Y_AXIS));
        List<Product> products = ProductDAO.getAllProducts();
        boolean hasAlert = false;
        for (Product p : products) {
            if (p.getQuantity() == 0) {
                JLabel l = new JLabel("[NO STOCK] " + p.getProductName());
                l.setForeground(new Color(200, 0, 0));
                l.setFont(new Font("Arial", Font.BOLD, 15));
                alertsPanel.add(l);
                hasAlert = true;
            } else if (p.getQuantity() <= p.getMinThreshold()) {
                JLabel l = new JLabel("[LOW STOCK] " + p.getProductName() + " (" + p.getQuantity() + "/min " + p.getMinThreshold() + ")");
                l.setForeground(new Color(200, 120, 0));
                l.setFont(new Font("Arial", Font.BOLD, 15));
                alertsPanel.add(l);
                hasAlert = true;
            }
        }
        if (!hasAlert) {
            JLabel l = new JLabel("No stock alerts.");
            l.setFont(new Font("Arial", Font.PLAIN, 15));
            l.setForeground(new Color(60, 60, 60));
            alertsPanel.add(l);
        }
        JScrollPane scrollPane = new JScrollPane(alertsPanel, JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED, JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        scrollPane.setOpaque(false);
        scrollPane.getViewport().setOpaque(false);
        scrollPane.setBorder(BorderFactory.createEmptyBorder());
        scrollPane.setPreferredSize(new Dimension(350, 180)); // Set max height for scroll
        box.add(scrollPane);
        outer.add(box, BorderLayout.CENTER);
        return outer;
    }

    private JPanel makeRecentTransactionsPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);
        JLabel title = new JLabel("Recent Transactions");
        title.setFont(new Font("Arial", Font.BOLD, 16));
        title.setForeground(new Color(60, 60, 90));
        panel.add(title, BorderLayout.NORTH);
        // Get last 5 transactions
        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        java.util.List<hardwarehub_main.model.Transaction> last5 = txns.stream().sorted((a, b) -> b.getTransactionId() - a.getTransactionId()).limit(5).collect(java.util.stream.Collectors.toList());
        String[] columns = {"ID", "Date", "Type", "Products", "Qty", "Unit Price", "Total Price", "Grand Total", "Buyer/Supplier", "Seller", "Delivery", "Status"};
        Object[][] data = new Object[last5.size()][columns.length];
        for (int i = 0; i < last5.size(); i++) {
            hardwarehub_main.model.Transaction txn = last5.get(i);
            List<hardwarehub_main.model.TransactionItem> items = hardwarehub_main.dao.TransactionDAO.getTransactionItemsByTransactionId(txn.getTransactionId());
            StringBuilder products = new StringBuilder();
            StringBuilder qtys = new StringBuilder();
            StringBuilder unitPrices = new StringBuilder();
            StringBuilder totalPrices = new StringBuilder();
            for (hardwarehub_main.model.TransactionItem item : items) {
                products.append(item.getProductName()).append("\n");
                qtys.append(item.getQuantity()).append("\n");
                unitPrices.append(item.getUnitPrice().toPlainString()).append("\n");
                totalPrices.append(item.getTotalPrice().toPlainString()).append("\n");
            }
            data[i][0] = txn.getTransactionId();
            data[i][1] = txn.getTransactionDate() != null ? txn.getTransactionDate().toString() : "";
            data[i][2] = txn.getTransactionType();
            data[i][3] = products.toString().trim();
            data[i][4] = qtys.toString().trim();
            data[i][5] = unitPrices.toString().trim();
            data[i][6] = totalPrices.toString().trim();
            data[i][7] = txn.getGrandTotal();
            data[i][8] = txn.getBuyerName() != null && !txn.getBuyerName().isBlank() ? txn.getBuyerName() : txn.getSellerName();
            data[i][9] = txn.getSellerName();
            data[i][10] = txn.getDeliveryMethod();
            data[i][11] = txn.getTransactionStatus() != null ? txn.getTransactionStatus() : "Ongoing";
        }
        DefaultTableModel model = new DefaultTableModel(data, columns) {
            @Override
            public boolean isCellEditable(int r, int c) {
                return false;
            }
        };
        JTable table = new JTable(model);
        table.setFont(new Font("Arial", Font.PLAIN, 14));
        table.setRowHeight(44);
        table.getTableHeader().setFont(new Font("Arial", Font.BOLD, 14));
        // Multi-line cell renderer
        table.setDefaultRenderer(Object.class, new javax.swing.table.DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {
                Component c = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
                if (value instanceof String) {
                    String stringValue = (String) value;
                    if (c instanceof JLabel) {
                        ((JLabel) c).setText("<html>" + stringValue.replace("\n", "<br>") + "</html>");
                        ((JLabel) c).setVerticalAlignment(JLabel.TOP);
                    }
                }
                return c;
            }
        });
        JScrollPane scroll = new JScrollPane(table);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        panel.add(scroll, BorderLayout.CENTER);
        return panel;
    }

    private void switchToPanel(JPanel panel) {
        parentFrame.setContentPane(panel);
        if (panel instanceof hardwarehub_main.util.JMenuBarProvider provider) {
            parentFrame.setJMenuBar(provider.createMenuBar());
        } else {
            parentFrame.setJMenuBar(null);
        }
        parentFrame.revalidate();
        parentFrame.repaint();
        // Call onPanelShown if available
        try {
            java.lang.reflect.Method m = panel.getClass().getMethod("onPanelShown");
            m.invoke(panel);
        } catch (Exception ignored) {}
    }

    private JPanel makeStatBox(String label, String value) {
        JPanel box = new JPanel();
        box.setOpaque(false);
        box.setLayout(new BoxLayout(box, BoxLayout.Y_AXIS));
        box.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(200, 200, 255, 120), 2, true),
                BorderFactory.createEmptyBorder(8, 24, 8, 24)));
        JLabel lbl = new JLabel(label);
        lbl.setFont(new Font("Arial", Font.BOLD, 16));
        lbl.setForeground(new Color(60, 60, 90));
        JLabel val = new JLabel(value);
        val.setFont(new Font("Arial", Font.BOLD, 26));
        val.setForeground(new Color(30, 34, 45));
        box.add(lbl);
        box.add(Box.createVerticalStrut(4));
        box.add(val);
        return box;
    }

    private String getCumulativeSales() {
        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        java.math.BigDecimal total = java.math.BigDecimal.ZERO;
        for (hardwarehub_main.model.Transaction t : txns) {
            if (t == null || t.getTransactionStatus() == null || t.getTransactionType() == null) {
                continue;
            }
            if (!"Completed".equalsIgnoreCase(t.getTransactionStatus())) {
                continue;
            }
            String type = t.getTransactionType();
            if ("Sale Walk-In".equalsIgnoreCase(type) || "Sale PO".equalsIgnoreCase(type)) {
                total = total.add(t.getGrandTotal());
            } else if ("Return".equalsIgnoreCase(type)) {
                total = total.subtract(t.getGrandTotal());
            }
        }
        return "₱" + total;
    }

    private String getTotalBuyers() {
        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        java.util.Set<String> buyers = new java.util.HashSet<>();
        for (hardwarehub_main.model.Transaction t : txns) {
            if (t.getBuyerName() != null && !t.getBuyerName().isBlank()) {
                buyers.add(t.getBuyerName());
            }
        }
        return String.valueOf(buyers.size());
    }

    private String getTotalSellers() {
        List<hardwarehub_main.model.Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
        java.util.Set<String> sellers = new java.util.HashSet<>();
        for (hardwarehub_main.model.Transaction t : txns) {
            if (t.getSellerName() != null && !t.getSellerName().isBlank()) {
                sellers.add(t.getSellerName());
            }
        }
        return String.valueOf(sellers.size());
    }

    // Glass pane loader overlay
    private void showLoader() {
        JFrame frame = (JFrame) SwingUtilities.getWindowAncestor(this);
        if (frame == null) return;
        if (loaderPane == null) {
            loaderPane = new JPanel(new GridBagLayout()) {
                @Override
                protected void paintComponent(Graphics g) {
                    super.paintComponent(g);
                    g.setColor(new Color(30, 30, 30, 120));
                    g.fillRect(0, 0, getWidth(), getHeight());
                }
            };
            loaderPane.setOpaque(false);
            JLabel gifLabel = new JLabel(hardwarehub_main.util.IconUtil.loadIcon("Loader.gif"));
            gifLabel.setText("Loading...");
            gifLabel.setFont(new Font("Arial", Font.BOLD, 18));
            gifLabel.setForeground(Color.WHITE);
            gifLabel.setHorizontalTextPosition(SwingConstants.CENTER);
            gifLabel.setVerticalTextPosition(SwingConstants.BOTTOM);
            loaderPane.add(gifLabel);
        }
        frame.setGlassPane(loaderPane);
        loaderPane.setVisible(true);
        loaderPane.revalidate();
        loaderPane.repaint();
    }
    private void hideLoader() {
        JFrame frame = (JFrame) SwingUtilities.getWindowAncestor(this);
        if (frame == null || loaderPane == null) return;
        loaderPane.setVisible(false);
        // Reset to default empty glass pane
        frame.setGlassPane(new JPanel());
    }

    // Helper to show loading overlay when switching panels
    private void switchToPanelWithLoader(JPanel panel) {
        JFrame frame = (JFrame) SwingUtilities.getWindowAncestor(this);
        frame.setCursor(Cursor.getPredefinedCursor(Cursor.WAIT_CURSOR));
        SwingWorker<Void, Void> worker = new SwingWorker<>() {
            @Override
            protected Void doInBackground() {
                try { Thread.sleep(700); } catch (InterruptedException ignored) {}
                return null;
            }
            @Override
            protected void done() {
                if (frame != null) {
                    frame.setContentPane(panel);
                    // Set menu bar based on panel type
                    if (panel instanceof hardwarehub_main.util.JMenuBarProvider provider) {
                        frame.setJMenuBar(provider.createMenuBar());
                    } else {
                        frame.setJMenuBar(null);
                    }
                    frame.revalidate();
                    frame.repaint();
                    frame.setCursor(Cursor.getDefaultCursor());
                    // Call onPanelShown if available
                    try {
                        java.lang.reflect.Method m = panel.getClass().getMethod("onPanelShown");
                        m.invoke(panel);
                    } catch (Exception ignored) {}
                }
            }
        };
        worker.execute();
    }

    public static void main(String[] args) {
        // Ensure UI creation on EDT
        SwingUtilities.invokeLater(() -> {
            SubstanceCortex.GlobalScope.setSkin(new BusinessBlueSteelSkin());

            // Create frame
            JFrame frame = new JFrame("HardwareHub");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(1650, 1000);
            frame.setLocationRelativeTo(null);

            // Optionally set app icon
            ImageIcon logo = IconUtil.loadIcon("HardwareHub_Icon.png");
            frame.setIconImage(logo.getImage());

            // Add DashboardPanel
            frame.setJMenuBar(null);
            frame.setContentPane(new hardwarehub_main.gui.dashboard.DashboardPanel(frame));

            // Show window
            frame.setVisible(true);
        });
    }
}
