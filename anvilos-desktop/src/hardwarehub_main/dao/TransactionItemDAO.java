package hardwarehub_main.dao;

import hardwarehub_main.model.TransactionItem;
import hardwarehub_main.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TransactionItemDAO {
    public static boolean insertTransactionItem(TransactionItem item) {
        String sql = "INSERT INTO transaction_items (TRANSACTION_ID, PRODUCT_ID, PRODUCT_NAME, QUANTITY, UNIT_PRICE, TOTAL_PRICE) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, item.getTransactionId());
            stmt.setInt(2, item.getProductId());
            stmt.setString(3, item.getProductName());
            stmt.setInt(4, item.getQuantity());
            stmt.setBigDecimal(5, item.getUnitPrice());
            stmt.setBigDecimal(6, item.getTotalPrice());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[TransactionItemDAO] insert error: " + e.getMessage());
            return false;
        }
    }

    public static List<TransactionItem> getTransactionItemsByTransactionId(int transactionId) {
        List<TransactionItem> items = new ArrayList<>();
        String sql = "SELECT * FROM transaction_items WHERE TRANSACTION_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, transactionId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    items.add(extractFromResultSet(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("[TransactionItemDAO] getByTransactionId error: " + e.getMessage());
        }
        return items;
    }

    public static boolean deleteTransactionItemsByTransactionId(int transactionId) {
        String sql = "DELETE FROM transaction_items WHERE TRANSACTION_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, transactionId);
            stmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("[TransactionItemDAO] deleteByTransactionId error: " + e.getMessage());
            return false;
        }
    }

    private static TransactionItem extractFromResultSet(ResultSet rs) throws SQLException {
        TransactionItem item = new TransactionItem();
        item.setItemId(rs.getInt("ITEM_ID"));
        item.setTransactionId(rs.getInt("TRANSACTION_ID"));
        item.setProductId(rs.getInt("PRODUCT_ID"));
        item.setProductName(rs.getString("PRODUCT_NAME"));
        item.setQuantity(rs.getInt("QUANTITY"));
        item.setUnitPrice(rs.getBigDecimal("UNIT_PRICE"));
        item.setTotalPrice(rs.getBigDecimal("TOTAL_PRICE"));
        return item;
    }
} 