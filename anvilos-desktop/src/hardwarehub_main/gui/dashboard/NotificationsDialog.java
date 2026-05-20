package hardwarehub_main.gui.dashboard;

import hardwarehub_main.dao.AuditLogDAO;
import hardwarehub_main.model.AuditLog;
import hardwarehub_main.model.Notification;
import hardwarehub_main.model.User;
import java.awt.*;
import java.awt.event.*;
import java.time.LocalDateTime; // Import Supplier
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import javax.swing.*;
import javax.swing.border.EmptyBorder;

public class NotificationsDialog extends JDialog {

    // Changed to Supplier to always get the latest notifications
    private final Supplier<List<Notification>> notificationProvider;
    private final Consumer<Notification> onNotificationClick;
    private final Runnable onMarkAllAsRead;
    private final JPanel notificationPanel;

    public NotificationsDialog(Frame owner,
            Supplier<List<Notification>> notificationProvider, // Accepts a Supplier
            Consumer<Notification> onNotificationClick,
            Runnable onMarkAllAsRead) { // New callback
        super(owner, "Notifications", true); // Modal dialog
        this.notificationProvider = notificationProvider;
        this.onNotificationClick = onNotificationClick;
        this.onMarkAllAsRead = onMarkAllAsRead;

        setSize(400, 500);
        setLocationRelativeTo(owner);
        setLayout(new BorderLayout());

        // Notification container
        notificationPanel = new JPanel();
        notificationPanel.setLayout(new BoxLayout(notificationPanel, BoxLayout.Y_AXIS));
        refreshNotifications(); // Initial rendering

        JScrollPane scrollPane = new JScrollPane(notificationPanel);
        add(scrollPane, BorderLayout.CENTER);

        // Bottom controls
        JButton markAllButton = new JButton("Mark All as Read");
        markAllButton.addActionListener(e -> {
            hardwarehub_main.dao.NotificationDAO.markAllAsRead(); //Execute the 'mark all as read' function
            refreshNotifications(); // Re-render to reflect changes
            if (onMarkAllAsRead != null) {
                onMarkAllAsRead.run();
            }
            // --- Audit log for mark all as read ---
            User user = User.getCurrentUser();
            int sellerId = user != null ? user.getSellerId() : 0;
            LocalDateTime now = LocalDateTime.now();
            String details = "Marked all notifications as read at " + now;
            AuditLogDAO.insertAuditLog(new AuditLog(0, sellerId, now, true, "NotificationDialog", "MarkAllRead", details));
        });

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        buttonPanel.add(markAllButton);
        add(buttonPanel, BorderLayout.SOUTH);
    }

    /**
     * Refreshes the display of notifications in the dialog. It fetches the
     * latest list from the provider and re-renders.
     */
    private void refreshNotifications() {
        notificationPanel.removeAll();

        // Get the latest list of notifications from the provider
        List<Notification> currentNotifications = notificationProvider.get();

        // Filter out dynamic notifications that are read.
        // Persistent notifications, even if read, are shown (but not bold) unless deleted.
        List<Notification> displayNotifications = currentNotifications.stream()
                .filter(notif -> !notif.isRead() || !notif.isDynamic()) // Show unread OR non-dynamic (persistent)
                .collect(Collectors.toList());

        if (displayNotifications.isEmpty()) {
            JLabel noNotif = new JLabel("No notifications.");
            noNotif.setHorizontalAlignment(SwingConstants.CENTER);
            notificationPanel.add(noNotif);
        } else {
            for (Notification notif : displayNotifications) {
                JPanel notifItem = createNotificationItem(notif);
                notificationPanel.add(notifItem);
            }
        }

        notificationPanel.revalidate();
        notificationPanel.repaint();

        // --- Audit log for viewing notifications ---
        User user = User.getCurrentUser();
        int sellerId = user != null ? user.getSellerId() : 0;
        LocalDateTime now = LocalDateTime.now();
        String details = "Viewed notifications at " + now + ", count: " + currentNotifications.size();
        AuditLogDAO.insertAuditLog(new AuditLog(0, sellerId, now, true, "NotificationDialog", "View", details));
    }

    /**
     * Creates a single notification item panel for display in the dialog.
     */
    private JPanel createNotificationItem(Notification notif) {
        JPanel item = new JPanel(new BorderLayout());
        item.setBackground(notif.isRead() ? Color.WHITE : new Color(235, 245, 255)); // Light blue for unread

        JLabel messageLabel = new JLabel(notif.getMessage());
        messageLabel.setFont(notif.isRead() ? messageLabel.getFont() : messageLabel.getFont().deriveFont(Font.BOLD));

        // Add datetime stamp
        String dateTimeStr = notif.getCreatedAt() != null ? notif.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "";
        JLabel dateLabel = new JLabel(dateTimeStr);
        dateLabel.setFont(new Font("Arial", Font.ITALIC, 11));
        dateLabel.setHorizontalAlignment(SwingConstants.RIGHT);
        dateLabel.setForeground(Color.GRAY);

        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.setOpaque(false);
        topPanel.add(messageLabel, BorderLayout.CENTER);
        topPanel.add(dateLabel, BorderLayout.EAST);

        // Add a subtle border for separation
        item.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 0, 1, 0, new Color(220, 220, 220)), // Bottom line
                new EmptyBorder(10, 10, 10, 10)
        ));

        item.add(topPanel, BorderLayout.CENTER);

        item.addMouseListener(new MouseAdapter() {
            public void mouseClicked(MouseEvent e) {
                if (!notif.isRead()) {
                    onNotificationClick.accept(notif);
                    refreshNotifications();
                    // --- Audit log for viewing a notification ---
                    User user = User.getCurrentUser();
                    int sellerId = user != null ? user.getSellerId() : 0;
                    LocalDateTime now = LocalDateTime.now();
                    String details = "Viewed notification: '" + notif.getMessage() + "' at " + now;
                    AuditLogDAO.insertAuditLog(new AuditLog(0, sellerId, now, true, "NotificationDialog", "View", details));
                }
            }
            public void mouseEntered(MouseEvent e) {
                item.setBackground(new Color(220, 230, 245));
            }
            public void mouseExited(MouseEvent e) {
                item.setBackground(notif.isRead() ? Color.WHITE : new Color(235, 245, 255));
            }
        });
        return item;
    }
}
