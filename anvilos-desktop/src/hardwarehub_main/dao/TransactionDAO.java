package hardwarehub_main.dao;

import hardwarehub_main.model.Transaction;
import hardwarehub_main.model.TransactionItem;
import hardwarehub_main.util.DBConnection;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TransactionDAO {

    private static List<Transaction> transactionCache = null;
    private static long lastCacheTime = 0;
    private static final long CACHE_TTL_MS = 10000; // 10 seconds

    public static int insertTransaction(Transaction txn) {
        String sql = "INSERT INTO transactions "
                + "(BUYER_NAME, BUYER_ADDRESS, BUYER_CONTACT, SELLER_ID, SELLER_NAME, TRANSACTION_TYPE, DELIVERY_METHOD,"
                + " TRANSACTION_DATE, GRAND_TOTAL, TRANSACTION_STATUS, CREATED_AT, UPDATED_AT, RECEIPT_NUMBER, IS_RETURNED, RETURN_FOR_RECEIPT_NUMBER)"
                + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, txn.getBuyerName());
            stmt.setString(2, txn.getBuyerAddress());
            stmt.setString(3, txn.getBuyerContact());
            stmt.setInt(4, txn.getSellerId());
            stmt.setString(5, txn.getSellerName());
            stmt.setString(6, txn.getTransactionType());
            stmt.setString(7, txn.getDeliveryMethod());
            stmt.setDate(8, txn.getTransactionDate() != null ? Date.valueOf(txn.getTransactionDate()) : null);
            stmt.setBigDecimal(9, txn.getGrandTotal());
            stmt.setString(10, txn.getTransactionStatus());
            stmt.setTimestamp(11, txn.getCreatedAt() != null ? Timestamp.valueOf(txn.getCreatedAt()) : Timestamp.valueOf(LocalDateTime.now()));
            stmt.setTimestamp(12, txn.getUpdatedAt() != null ? Timestamp.valueOf(txn.getUpdatedAt()) : Timestamp.valueOf(LocalDateTime.now()));
            stmt.setInt(13, txn.getReceiptNumber());
            stmt.setInt(14, txn.getIsReturned());
            if (txn.getReturnForReceiptNumber() != null) {
                stmt.setInt(15, txn.getReturnForReceiptNumber());
            } else {
                stmt.setNull(15, Types.INTEGER);
            }
            int affected = stmt.executeUpdate();
            if (affected == 0) {
                return -1;
            }
            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    return generatedKeys.getInt(1);
                }
            }
        } catch (SQLException e) {
            System.err.println("[TransactionDAO] insertTransaction error: " + e.getMessage());
        }
        return -1;
    }

    public static boolean insertTransactionItem(TransactionItem item) {
        String sql = "INSERT INTO transaction_items (TRANSACTION_ID, PRODUCT_ID, PRODUCT_NAME, QUANTITY, UNIT_PRICE, TOTAL_PRICE) "
                + "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, item.getTransactionId());
            stmt.setInt(2, item.getProductId());
            stmt.setString(3, item.getProductName());
            stmt.setInt(4, item.getQuantity());
            stmt.setBigDecimal(5, item.getUnitPrice());
            stmt.setBigDecimal(6, item.getTotalPrice());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
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
                    TransactionItem item = new TransactionItem();
                    item.setItemId(rs.getInt("ITEM_ID"));
                    item.setTransactionId(rs.getInt("TRANSACTION_ID"));
                    item.setProductId(rs.getInt("PRODUCT_ID"));
                    item.setProductName(rs.getString("PRODUCT_NAME"));
                    item.setQuantity(rs.getInt("QUANTITY"));
                    item.setUnitPrice(rs.getBigDecimal("UNIT_PRICE"));
                    item.setTotalPrice(rs.getBigDecimal("TOTAL_PRICE"));
                    items.add(item);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return items;
    }

    private static Transaction extractTransactionFromResultSet(ResultSet rs) throws SQLException {
        Transaction txn = new Transaction();
        txn.setTransactionId(rs.getInt("TRANSACTION_ID"));
        txn.setBuyerName(rs.getString("BUYER_NAME"));
        txn.setBuyerAddress(rs.getString("BUYER_ADDRESS"));
        txn.setBuyerContact(rs.getString("BUYER_CONTACT"));
        txn.setSellerId(rs.getInt("SELLER_ID"));
        txn.setSellerName(rs.getString("SELLER_NAME"));
        txn.setTransactionType(rs.getString("TRANSACTION_TYPE"));
        txn.setDeliveryMethod(rs.getString("DELIVERY_METHOD"));
        java.sql.Date sqlDate = rs.getDate("TRANSACTION_DATE");
        txn.setTransactionDate(sqlDate != null ? sqlDate.toLocalDate() : null);
        txn.setGrandTotal(rs.getBigDecimal("GRAND_TOTAL"));
        txn.setTransactionStatus(rs.getString("TRANSACTION_STATUS"));
        Timestamp created = rs.getTimestamp("CREATED_AT");
        Timestamp updated = rs.getTimestamp("UPDATED_AT");
        txn.setCreatedAt(created != null ? created.toLocalDateTime() : null);
        txn.setUpdatedAt(updated != null ? updated.toLocalDateTime() : null);
        txn.setReceiptNumber(rs.getInt("RECEIPT_NUMBER"));
        txn.setIsReturned(rs.getInt("IS_RETURNED"));
        int rfrn = rs.getInt("RETURN_FOR_RECEIPT_NUMBER");
        if (!rs.wasNull()) {
            txn.setReturnForReceiptNumber(rfrn);
        } else {
            txn.setReturnForReceiptNumber(null);
        }
        return txn;
    }

    public static List<Transaction> getAllTransactions() {
        long now = System.currentTimeMillis();
        if (transactionCache == null || (now - lastCacheTime) > CACHE_TTL_MS) {
            transactionCache = fetchAllTransactions();
            lastCacheTime = now;
        }
        return transactionCache;
    }

    public static void refreshTransactionCache() {
        transactionCache = fetchAllTransactions();
        lastCacheTime = System.currentTimeMillis();
    }

    private static List<Transaction> fetchAllTransactions() {
        List<Transaction> transactions = new ArrayList<>();
        String sql = "SELECT * FROM transactions ORDER BY TRANSACTION_DATE DESC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                transactions.add(extractTransactionFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[TransactionDAO] getAllTransactions error: " + e.getMessage());
        }
        return transactions;
    }

    public static Transaction getTransactionById(int id) {
        String sql = "SELECT * FROM transactions WHERE TRANSACTION_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return extractTransactionFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[TransactionDAO] getTransactionById error: " + e.getMessage());
        }
        return null;
    }

    public static boolean deleteTransaction(int id) {
        String sql = "DELETE FROM transactions WHERE TRANSACTION_ID = ?";

        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean updateTransaction(Transaction txn) {
        String sql = "UPDATE transactions SET BUYER_NAME=?, BUYER_ADDRESS=?, BUYER_CONTACT=?, SELLER_ID=?, SELLER_NAME=?, TRANSACTION_TYPE=?, DELIVERY_METHOD=?, TRANSACTION_DATE=?, GRAND_TOTAL=?, TRANSACTION_STATUS=?, UPDATED_AT=?, PAYMENT_METHOD=?, RECEIPT_NUMBER=?, IS_RETURNED=?, RETURN_FOR_RECEIPT_NUMBER=? WHERE TRANSACTION_ID=?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, txn.getBuyerName());
            stmt.setString(2, txn.getBuyerAddress());
            stmt.setString(3, txn.getBuyerContact());
            stmt.setInt(4, txn.getSellerId());
            stmt.setString(5, txn.getSellerName());
            stmt.setString(6, txn.getTransactionType());
            stmt.setString(7, txn.getDeliveryMethod());
            stmt.setDate(8, txn.getTransactionDate() != null ? Date.valueOf(txn.getTransactionDate()) : null);
            stmt.setBigDecimal(9, txn.getGrandTotal());
            stmt.setString(10, txn.getTransactionStatus());
            stmt.setTimestamp(11, txn.getUpdatedAt() != null ? Timestamp.valueOf(txn.getUpdatedAt()) : Timestamp.valueOf(LocalDateTime.now()));
            stmt.setString(12, txn.getPaymentMethod());
            stmt.setInt(13, txn.getReceiptNumber());
            stmt.setInt(14, txn.getIsReturned());
            if (txn.getReturnForReceiptNumber() != null) {
                stmt.setInt(15, txn.getReturnForReceiptNumber());
            } else {
                stmt.setNull(15, Types.INTEGER);
            }
            stmt.setInt(16, txn.getTransactionId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[TransactionDAO] updateTransaction error: " + e.getMessage());
        }
        return false;
    }

// Add this method to delete transaction items by transaction id:
    public static void deleteTransactionItemsByTransactionId(int transactionId) {
        String sql = "DELETE FROM transaction_items WHERE TRANSACTION_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, transactionId);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static Transaction getTransactionByReceiptNumber(int receiptNumber) {
        String sql = "SELECT * FROM transactions WHERE RECEIPT_NUMBER = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, receiptNumber);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return extractTransactionFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[TransactionDAO] getTransactionByReceiptNumber error: " + e.getMessage());
        }
        return null;
    }
}
