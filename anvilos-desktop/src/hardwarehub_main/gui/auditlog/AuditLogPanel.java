package hardwarehub_main.gui.auditlog;

import hardwarehub_main.model.AuditLog;
import hardwarehub_main.model.User;
import hardwarehub_main.dao.AuditLogDAO;
import hardwarehub_main.util.IconUtil;
import hardwarehub_main.gui.dashboard.DashboardPanel;
import com.toedter.calendar.JDateChooser;
import hardwarehub_login.LoaderDialog;
import hardwarehub_main.util.UIConstants;
import hardwarehub_main.util.DialogUtils;
import javax.swing.JToolBar;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.*;
import java.util.stream.Collectors;

public class AuditLogPanel extends JPanel {

    private JFrame parentFrame;
    private JTable table;
    private DefaultTableModel tableModel;
    private JTextField searchField;
    private JRadioButton rbAll, rbLogin, rbProcess, rbStock;
    private ButtonGroup filterGroup;
    private JDateChooser dateFrom, dateTo;
    private JComboBox<String> sortOrderBox;
    private JComboBox<String> panelBox, actionBox, userBox;
    private List<AuditLog> allLogs;
    private List<AuditLog> filteredLogs;
    // Glass pane loader overlay for dashboard return
    private JPanel loaderPane = null;

    public AuditLogPanel(JFrame parentFrame) {
        this.parentFrame = parentFrame;
        setLayout(new BorderLayout());
        setBackground(UIConstants.BACKGROUND);
        // Office-style Ribbon
        JToolBar ribbon = createRibbon();
        // Filters panel
        JPanel filters = makeFiltersPanel();
        // Top panel holds ribbon and filters
        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.add(ribbon, BorderLayout.NORTH);
        topPanel.add(filters, BorderLayout.CENTER);
        add(topPanel, BorderLayout.NORTH);
        // Table in the center
        tableModel = new DefaultTableModel(new Object[]{"Time", "Panel", "Action", "Details"}, 0) {
            public boolean isCellEditable(int row, int col) {
                return false;
            }
        };
        table = new JTable(tableModel);
        table.setFont(new Font("Arial", Font.PLAIN, 14));
        table.setRowHeight(22);
        table.getTableHeader().setFont(new Font("Arial", Font.BOLD, 14));
        JScrollPane scroll = new JScrollPane(table);
        scroll.setBorder(new EmptyBorder(8, 16, 8, 16));
        add(scroll, BorderLayout.CENTER);
        // Key bindings
        JRootPane root = parentFrame != null ? parentFrame.getRootPane() : SwingUtilities.getRootPane(this);
        if (root != null) {
            registerKeyBindings(root);
        }
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
                createAction("Back", "BackButton.png", e -> goBack())
        ));
        ribbon.addSeparator(new Dimension(20, 0));
        // View group
        ribbon.add(createGroupPanel("View",
                createAction("Refresh", "AuditLog/RefreshAuditLogsButton.png", e -> loadAuditLogs())
        ));
        ribbon.addSeparator(new Dimension(20, 0));
        // Reports group
        ribbon.add(createGroupPanel("Reports",
                createAction("Export", "AuditLog/ExportAuditLogsButton.png", e -> onExport())
        ));
        ribbon.addSeparator(new Dimension(20, 0));
        // Help group
        ribbon.add(createGroupPanel("Help",
                createAction("Help", "AuditLog/AboutIconButton.png", e -> showHelp())
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
        btn.setToolTipText(text);
        btn.addActionListener(listener);
        return btn;
    }

    private JPanel makeFiltersPanel() {
        JPanel filters = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 8));
        filters.setBackground(UIConstants.PANEL_BG);
        // Radio buttons
        rbAll = new JRadioButton("All");
        rbLogin = new JRadioButton("Login");
        rbProcess = new JRadioButton("Process");
        rbStock = new JRadioButton("Stock");
        filterGroup = new ButtonGroup();
        filterGroup.add(rbAll);
        filterGroup.add(rbLogin);
        filterGroup.add(rbProcess);
        filterGroup.add(rbStock);
        rbAll.setSelected(true);
        filters.add(new JLabel("Type:"));
        filters.add(rbAll);
        filters.add(rbLogin);
        filters.add(rbProcess);
        filters.add(rbStock);
        // Panel/module filter
        filters.add(new JLabel("Panel:"));
        panelBox = new JComboBox<>(getPanelOptions());
        filters.add(panelBox);
        // Action filter
        filters.add(new JLabel("Action:"));
        actionBox = new JComboBox<>(getActionOptions());
        filters.add(actionBox);
        // User filter
        filters.add(new JLabel("User:"));
        userBox = new JComboBox<>(getUserOptions());
        filters.add(userBox);
        // Search bar
        filters.add(new JLabel("Search:"));
        searchField = new JTextField(18);
        filters.add(searchField);
        // Date pickers
        filters.add(new JLabel("From:"));
        dateFrom = new com.toedter.calendar.JDateChooser();
        dateFrom.setDateFormatString("yyyy-MM-dd");
        filters.add(dateFrom);
        filters.add(new JLabel("To:"));
        dateTo = new com.toedter.calendar.JDateChooser();
        dateTo.setDateFormatString("yyyy-MM-dd");
        filters.add(dateTo);
        // Sort order
        filters.add(new JLabel("Sort:"));
        sortOrderBox = new JComboBox<>(new String[]{"Descending", "Ascending"});
        filters.add(sortOrderBox);
        // Listeners
        ActionListener filterListener = e -> filterAndDisplayLogs();
        rbAll.addActionListener(filterListener);
        rbLogin.addActionListener(filterListener);
        rbProcess.addActionListener(filterListener);
        rbStock.addActionListener(filterListener);
        panelBox.addActionListener(filterListener);
        actionBox.addActionListener(filterListener);
        userBox.addActionListener(filterListener);
        searchField.addKeyListener(new KeyAdapter() {
            public void keyReleased(KeyEvent e) {
                filterAndDisplayLogs();
            }
        });
        dateFrom.getDateEditor().addPropertyChangeListener(e -> filterAndDisplayLogs());
        dateTo.getDateEditor().addPropertyChangeListener(e -> filterAndDisplayLogs());
        sortOrderBox.addActionListener(e -> filterAndDisplayLogs());
        return filters;
    }

    private void goBack() {
        if (parentFrame != null) {
            parentFrame.setCursor(Cursor.getPredefinedCursor(Cursor.WAIT_CURSOR));
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
                            parentFrame.setContentPane(new DashboardPanel(parentFrame));
                            parentFrame.revalidate();
                            parentFrame.repaint();
                            parentFrame.setCursor(Cursor.getDefaultCursor());
                        }
                    };
                    worker.execute();
                });
            });
        }
    }

    private void loadAuditLogs() {
        List<AuditLog> userLogs = AuditLogDAO.getAuditLogsBySellerId(User.getCurrentUser().getSellerId());
        List<AuditLog> universalLogs = AuditLogDAO.getUniversalAuditLogs();
        allLogs = new ArrayList<>();
        allLogs.addAll(userLogs);
        allLogs.addAll(universalLogs);
        allLogs.sort((a, b) -> b.getLogTime().compareTo(a.getLogTime()));
        // Update filter dropdowns
        if (panelBox != null) panelBox.setModel(new DefaultComboBoxModel<>(getPanelOptions()));
        if (actionBox != null) actionBox.setModel(new DefaultComboBoxModel<>(getActionOptions()));
        if (userBox != null) userBox.setModel(new DefaultComboBoxModel<>(getUserOptions()));
        filterAndDisplayLogs();
    }

    private void filterAndDisplayLogs() {
        if (allLogs == null) {
            return;
        }
        filteredLogs = allLogs.stream().filter(this::filterLog).collect(Collectors.toList());
        // Sort
        filteredLogs.sort((a, b) -> {
            if (a.getLogTime() == null || b.getLogTime() == null) {
                return 0;
            }
            int cmp = a.getLogTime().compareTo(b.getLogTime());
            return "Ascending".equals(sortOrderBox.getSelectedItem()) ? cmp : -cmp;
        });
        // Display
        tableModel.setRowCount(0);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        for (AuditLog log : filteredLogs) {
            tableModel.addRow(new Object[]{
                log.getLogTime() != null ? log.getLogTime().format(fmt) : "",
                log.getPanel(),
                log.getAction(),
                log.getDetails()
            });
        }
    }

    private boolean filterLog(AuditLog log) {
        // Type
        if (rbLogin.isSelected() && (log.getAction() == null || !log.getAction().toLowerCase().contains("login"))) {
            return false;
        }
        if (rbProcess.isSelected() && (log.getAction() == null || log.getAction().toLowerCase().contains("login") || log.getAction().toLowerCase().contains("stock"))) {
            return false;
        }
        if (rbStock.isSelected() && (log.getAction() == null || !(log.getAction().toLowerCase().contains("stock")))) {
            return false;
        }
        // Panel/module filter
        if (panelBox != null && panelBox.getSelectedItem() != null && !"All".equals(panelBox.getSelectedItem())) {
            if (log.getPanel() == null || !log.getPanel().equals(panelBox.getSelectedItem())) {
                return false;
            }
        }
        // Action filter
        if (actionBox != null && actionBox.getSelectedItem() != null && !"All".equals(actionBox.getSelectedItem())) {
            if (log.getAction() == null || !log.getAction().equals(actionBox.getSelectedItem())) {
                return false;
            }
        }
        // User filter
        if (userBox != null && userBox.getSelectedItem() != null && !"All".equals(userBox.getSelectedItem())) {
            String sellerName = hardwarehub_main.model.User.getSellerNameById(log.getSellerId());
            if (!userBox.getSelectedItem().equals(sellerName)) {
                return false;
            }
        }
        // Search
        String search = searchField.getText().trim().toLowerCase();
        if (!search.isEmpty()) {
            boolean found = false;
            if (log.getPanel() != null && log.getPanel().toLowerCase().contains(search)) {
                found = true;
            }
            if (log.getAction() != null && log.getAction().toLowerCase().contains(search)) {
                found = true;
            }
            if (log.getDetails() != null && log.getDetails().toLowerCase().contains(search)) {
                found = true;
            }
            if (!found) {
                return false;
            }
        }
        // Date
        Date from = dateFrom.getDate();
        Date to = dateTo.getDate();
        if (from != null && log.getLogTime() != null && log.getLogTime().toLocalDate().isBefore(convertToLocalDate(from))) {
            return false;
        }
        if (to != null && log.getLogTime() != null && log.getLogTime().toLocalDate().isAfter(convertToLocalDate(to))) {
            return false;
        }
        return true;
    }

    private LocalDate convertToLocalDate(Date date) {
        return date.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
    }

    private void registerKeyBindings(JRootPane root) {
        bindKey(root, "back", KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, InputEvent.ALT_DOWN_MASK), e -> goBack());
        bindKey(root, "refresh", KeyStroke.getKeyStroke(KeyEvent.VK_R, InputEvent.CTRL_DOWN_MASK), e -> loadAuditLogs());
        bindKey(root, "export", KeyStroke.getKeyStroke(KeyEvent.VK_S, InputEvent.CTRL_DOWN_MASK), e -> onExport());
        bindKey(root, "help", KeyStroke.getKeyStroke(KeyEvent.VK_H, InputEvent.CTRL_DOWN_MASK), e -> showHelp());
    }

    private void bindKey(JRootPane root, String name, KeyStroke keyStroke, ActionListener action) {
        root.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(keyStroke, name);
        root.getActionMap().put(name, new AbstractAction() {
            public void actionPerformed(ActionEvent e) {
                action.actionPerformed(e);
            }
        });
    }

    public JMenuBar createMenuBar() {
        JMenuBar menuBar = new JMenuBar();
        // File menu
        JMenu fileMenu = new JMenu("File");
        fileMenu.add(createMenuItem("Export Audit Logs", KeyStroke.getKeyStroke(KeyEvent.VK_S, InputEvent.CTRL_DOWN_MASK), e -> onExport()));
        menuBar.add(fileMenu);
        // View menu
        JMenu viewMenu = new JMenu("View");
        viewMenu.add(createMenuItem("Refresh Table", KeyStroke.getKeyStroke(KeyEvent.VK_R, InputEvent.CTRL_DOWN_MASK), e -> loadAuditLogs()));
        menuBar.add(viewMenu);
        // Help menu
        JMenu helpMenu = new JMenu("Help");
        helpMenu.add(createMenuItem("Help", KeyStroke.getKeyStroke(KeyEvent.VK_H, InputEvent.CTRL_DOWN_MASK), e -> showHelp()));
        menuBar.add(helpMenu);
        return menuBar;
    }

    private JMenuItem createMenuItem(String text, KeyStroke shortcut, java.awt.event.ActionListener action) {
        JMenuItem item = new JMenuItem(text);
        item.setAccelerator(shortcut);
        item.addActionListener(action);
        return item;
    }

    private void onExport() {
        ExportAuditLogsDialog dialog = new ExportAuditLogsDialog(SwingUtilities.getWindowAncestor(this), allLogs, filteredLogs);
        dialog.setVisible(true);
    }

    private void showHelp() {
        StringBuilder sb = new StringBuilder();
        sb.append("AUDIT LOG PANEL HELP\n\n");
        sb.append("Purpose:\n- View all audit logs for your account, including login, process, and stock alerts.\n\n");
        sb.append("Ribbon Buttons:\n- Back: Return to dashboard.\n- Refresh: Reload audit logs.\n- Export: Export logs to CSV.\n- Help: Show this help dialog.\n\n");
        sb.append("Filters:\n- Type: Filter by log type (All, Login, Process, Stock).\n- Search: Search by panel, action, or details.\n- Date: Filter by date range.\n- Sort: Ascending/Descending by time.\n\n");
        sb.append("Keyboard Shortcuts:\n- Back: Alt+Left\n- Refresh: Ctrl+R\n- Export: Ctrl+S\n- Help: Ctrl+H\n");
        sb.append("Developed by: JCBP Solutions © 2025\nHardwareHub v1.0");
        JOptionPane.showMessageDialog(this, sb.toString(), "Audit Log Help", JOptionPane.INFORMATION_MESSAGE);
    }

    private String[] getPanelOptions() {
        Set<String> panels = new HashSet<>();
        panels.add("All");
        if (allLogs != null) {
            for (AuditLog log : allLogs) {
                if (log.getPanel() != null && !log.getPanel().isEmpty()) {
                    panels.add(log.getPanel());
                }
            }
        }
        return panels.toArray(new String[0]);
    }

    private String[] getActionOptions() {
        Set<String> actions = new HashSet<>();
        actions.add("All");
        if (allLogs != null) {
            for (AuditLog log : allLogs) {
                if (log.getAction() != null && !log.getAction().isEmpty()) {
                    actions.add(log.getAction());
                }
            }
        }
        return actions.toArray(new String[0]);
    }

    private String[] getUserOptions() {
        Set<String> users = new HashSet<>();
        users.add("All");
        if (allLogs != null) {
            for (AuditLog log : allLogs) {
                int sellerId = log.getSellerId();
                String sellerName = hardwarehub_main.model.User.getSellerNameById(sellerId);
                if (sellerName != null && !sellerName.isEmpty()) {
                    users.add(sellerName);
                }
            }
        }
        return users.toArray(new String[0]);
    }

    public static void ensureMenuBar(JFrame frame) {
        if (frame != null) {
            frame.setJMenuBar(new AuditLogPanel(frame).createMenuBar());
        }
    }

    // Glass pane loader overlay for dashboard return
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
        frame.setGlassPane(new JPanel());
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
                List<AuditLog> userLogs = AuditLogDAO.getAuditLogsBySellerId(User.getCurrentUser().getSellerId());
                List<AuditLog> universalLogs = AuditLogDAO.getUniversalAuditLogs();
                allLogs = new ArrayList<>();
                allLogs.addAll(userLogs);
                allLogs.addAll(universalLogs);
                allLogs.sort((a, b) -> b.getLogTime().compareTo(a.getLogTime()));
                List<Object[]> rows = new ArrayList<>();
                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                for (AuditLog log : allLogs) {
                    rows.add(new Object[]{
                        log.getLogTime() != null ? log.getLogTime().format(fmt) : "",
                        log.getPanel(),
                        log.getAction(),
                        log.getDetails()
                    });
                }
                SwingUtilities.invokeLater(() -> {
                    tableModel.setRowCount(0);
                    for (Object[] row : rows) {
                        tableModel.addRow(row);
                    }
                    java.awt.Window w2 = SwingUtilities.getWindowAncestor(AuditLogPanel.this);
                    if (w2 instanceof JFrame frame2) {
                        frame2.setCursor(Cursor.getDefaultCursor());
                    }
                });
                return null;
            }
        };
        worker.execute();
    }
}
