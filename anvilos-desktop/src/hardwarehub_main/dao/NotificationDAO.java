package hardwarehub_main.dao;

import hardwarehub_main.model.Notification;
import hardwarehub_main.util.DBConnection;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class NotificationDAO {

    public static int addNotification(Notification n) {
        String sql = "INSERT INTO notifications (SYSTEM_NOTIFICATIONS, MESSAGE, IS_READ, CREATED_AT) VALUES (?, ?, ?, ?)";
        int generatedId = -1;
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, n.getSystemNotification());
            stmt.setString(2, n.getMessage());
            stmt.setBoolean(3, n.isRead());
            stmt.setTimestamp(4, n.getCreatedAt() != null ? Timestamp.valueOf(n.getCreatedAt()) : null);

            int affectedRows = stmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        generatedId = rs.getInt(1);
                        n.setNotificationID(generatedId);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("[NotificationDAO] addNotification error: " + e.getMessage());
            e.printStackTrace();
        }
        return generatedId;
    }

    public static boolean notificationExists(String systemNotification, String message) {
        String sql = "SELECT COUNT(*) FROM notifications WHERE SYSTEM_NOTIFICATIONS = ? AND MESSAGE = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, systemNotification);
            stmt.setString(2, message);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        } catch (SQLException e) {
            System.err.println("[NotificationDAO] notificationExists error: " + e.getMessage());
        }
        return false;
    }

    public static List<Notification> getUnreadNotifications() {
        List<Notification> list = new ArrayList<>();
        String sql = "SELECT NOTIFICATION_ID, SYSTEM_NOTIFICATIONS, MESSAGE, IS_READ, CREATED_AT FROM notifications WHERE IS_READ = 0 ORDER BY CREATED_AT DESC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(extractFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[NotificationDAO] getUnreadNotifications error: " + e.getMessage());
        }
        return list;
    }

    public static boolean markAsRead(int notificationId) {
        String sql = "UPDATE notifications SET IS_READ = 1 WHERE NOTIFICATION_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, notificationId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[NotificationDAO] markAsRead error: " + e.getMessage());
            return false;
        }
    }

    public static boolean markAllAsRead() {
        String sql = "UPDATE notifications SET IS_READ = 1 WHERE IS_READ = 0";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[NotificationDAO] markAllAsRead error: " + e.getMessage());
            return false;
        }
    }

    public static void deleteReadNotifications() {
        String sql = "DELETE FROM notifications WHERE IS_READ = 1";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static int getUnreadCount() {
        String sql = "SELECT COUNT(*) AS unread FROM notifications WHERE IS_READ = 0";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getInt("unread");
            }
        } catch (SQLException e) {
            System.err.println("[NotificationDAO] getUnreadCount error: " + e.getMessage());
        }
        return 0;
    }

    private static Notification extractFromResultSet(ResultSet rs) throws SQLException {
        Notification n = new Notification(
                rs.getInt("NOTIFICATION_ID"),
                rs.getString("SYSTEM_NOTIFICATIONS"),
                rs.getString("MESSAGE"),
                rs.getBoolean("IS_READ"),
                rs.getTimestamp("CREATED_AT") != null ? rs.getTimestamp("CREATED_AT").toLocalDateTime() : null
        );
        return n;
    }

    public static List<Notification> getAllNotifications() {
        List<Notification> list = new ArrayList<>();
        String sql = "SELECT NOTIFICATION_ID, SYSTEM_NOTIFICATIONS, MESSAGE, IS_READ, CREATED_AT FROM notifications ORDER BY CREATED_AT DESC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(extractFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[NotificationDAO] getAllNotifications error: " + e.getMessage());
        }
        return list;
    }
}
