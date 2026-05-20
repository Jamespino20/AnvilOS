package hardwarehub_main.dao;

import hardwarehub_main.model.AuditLog;
import hardwarehub_main.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AuditLogDAO {
    public static boolean insertAuditLog(AuditLog log) {
        // Always use a valid sellerId (never 0 unless a user with SELLER_ID=0 exists)
        if (log.getSellerId() == 0) {
            hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
            if (user != null) log.setSellerId(user.getSellerId());
        }
        String sql = "INSERT INTO audit_log (SELLER_ID, LOG_TIME, SUCCESS_STATUS, PANEL, ACTION, DETAILS) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, log.getSellerId());
            stmt.setTimestamp(2, log.getLogTime() != null ? Timestamp.valueOf(log.getLogTime()) : null);
            stmt.setBoolean(3, log.isSuccessStatus());
            stmt.setString(4, log.getPanel());
            stmt.setString(5, log.getAction());
            stmt.setString(6, log.getDetails());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[AuditLogDAO] insert error: " + e.getMessage());
            return false;
        }
    }

    public static List<AuditLog> getAllAuditLogs() {
        List<AuditLog> logs = new ArrayList<>();
        String sql = "SELECT * FROM audit_log ORDER BY LOG_TIME DESC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                logs.add(extractFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[AuditLogDAO] getAll error: " + e.getMessage());
        }
        return logs;
    }

    public static List<AuditLog> getAuditLogsBySellerId(int sellerId) {
        List<AuditLog> logs = new ArrayList<>();
        String sql = "SELECT * FROM audit_log WHERE SELLER_ID = ? ORDER BY LOG_TIME DESC";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, sellerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    logs.add(extractFromResultSet(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("[AuditLogDAO] getAuditLogsBySellerId error: " + e.getMessage());
        }
        return logs;
    }

    public static List<AuditLog> getUniversalAuditLogs() {
        List<AuditLog> logs = new ArrayList<>();
        String sql = "SELECT * FROM audit_log WHERE SELLER_ID = 0 ORDER BY LOG_TIME DESC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                logs.add(extractFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[AuditLogDAO] getUniversalAuditLogs error: " + e.getMessage());
        }
        return logs;
    }

    private static AuditLog extractFromResultSet(ResultSet rs) throws SQLException {
        AuditLog log = new AuditLog();
        log.setLogId(rs.getInt("LOG_ID"));
        log.setSellerId(rs.getInt("SELLER_ID"));
        Timestamp logTime = rs.getTimestamp("LOG_TIME");
        log.setLogTime(logTime != null ? logTime.toLocalDateTime() : null);
        log.setSuccessStatus(rs.getBoolean("SUCCESS_STATUS"));
        log.setPanel(rs.getString("PANEL"));
        log.setAction(rs.getString("ACTION"));
        log.setDetails(rs.getString("DETAILS"));
        return log;
    }
} 