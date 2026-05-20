package hardwarehub_main.dao;

import hardwarehub_main.model.User;
import hardwarehub_main.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserDAO {

    public static boolean insertUser(User user) {
        String sql = "INSERT INTO users (SELLER_NAME, PASSWORD_HASH, USERNAME, EMAIL, SECURITY_QUESTION1, SECURITY_ANSWER1, SECURITY_QUESTION2, SECURITY_ANSWER2, SECURITY_QUESTION3, SECURITY_ANSWER3, REGISTRY_DATE, LAST_LOGIN, IS_ACTIVE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, user.getSellerName());
            stmt.setString(2, user.getPasswordHash());
            stmt.setString(3, user.getUsername());
            stmt.setString(4, user.getEmail());
            stmt.setString(5, user.getSecurityQuestion1());
            stmt.setString(6, user.getSecurityAnswer1());
            stmt.setString(7, user.getSecurityQuestion2());
            stmt.setString(8, user.getSecurityAnswer2());
            stmt.setString(9, user.getSecurityQuestion3());
            stmt.setString(10, user.getSecurityAnswer3());
            stmt.setDate(11, user.getRegistryDate() != null ? Date.valueOf(user.getRegistryDate()) : null);
            stmt.setTimestamp(12, user.getLastLogin() != null ? Timestamp.valueOf(user.getLastLogin()) : null);
            stmt.setBoolean(13, user.isActive());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[UserDAO] insertUser error: " + e.getMessage());
            return false;
        }
    }

    public static boolean updateUser(User user) {
        String sql = "UPDATE users SET SELLER_NAME = ?, PASSWORD_HASH = ?, USERNAME = ?, EMAIL = ?, SECURITY_QUESTION1 = ?, SECURITY_ANSWER1 = ?, SECURITY_QUESTION2 = ?, SECURITY_ANSWER2 = ?, SECURITY_QUESTION3 = ?, SECURITY_ANSWER3 = ?, REGISTRY_DATE = ?, LAST_LOGIN = ?, IS_ACTIVE = ? WHERE SELLER_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, user.getSellerName());
            stmt.setString(2, user.getPasswordHash());
            stmt.setString(3, user.getUsername());
            stmt.setString(4, user.getEmail());
            stmt.setString(5, user.getSecurityQuestion1());
            stmt.setString(6, user.getSecurityAnswer1());
            stmt.setString(7, user.getSecurityQuestion2());
            stmt.setString(8, user.getSecurityAnswer2());
            stmt.setString(9, user.getSecurityQuestion3());
            stmt.setString(10, user.getSecurityAnswer3());
            stmt.setDate(11, user.getRegistryDate() != null ? Date.valueOf(user.getRegistryDate()) : null);
            stmt.setTimestamp(12, user.getLastLogin() != null ? Timestamp.valueOf(user.getLastLogin()) : null);
            stmt.setBoolean(13, user.isActive());
            stmt.setInt(14, user.getSellerId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[UserDAO] updateUser error: " + e.getMessage());
            return false;
        }
    }

    public static User getUserByUsername(String username) {
        String sql = "SELECT * FROM users WHERE USERNAME = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, username);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return extractUserFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[UserDAO] getUserByUsername error: " + e.getMessage());
        }
        return null;
    }

    public static boolean deleteUser(int sellerId) {
        String sql = "DELETE FROM users WHERE SELLER_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, sellerId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[UserDAO] deleteUser error: " + e.getMessage());
            return false;
        }
    }

    public static List<User> getAllUsers() {
        List<User> users = new ArrayList<>();
        String sql = "SELECT * FROM users ORDER BY REGISTRY_DATE DESC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                users.add(extractUserFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[UserDAO] getAllUsers error: " + e.getMessage());
        }
        return users;
    }

    public static boolean updateUserActiveStatus(int sellerId, int isActive) {
        String sql = "UPDATE users SET IS_ACTIVE = ? WHERE SELLER_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, isActive);
            stmt.setInt(2, sellerId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[UserDAO] updateUserActiveStatus error: " + e.getMessage());
            return false;
        }
    }

    public static User getUserBySellerId(int sellerId) {
        String sql = "SELECT * FROM users WHERE SELLER_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, sellerId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    User user = new User();
                    user.setSellerId(rs.getInt("SELLER_ID"));
                    user.setSellerName(rs.getString("SELLER_NAME"));
                    // Set other fields as needed
                    return user;
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    private static User extractUserFromResultSet(ResultSet rs) throws SQLException {
        User user = new User();
        user.setSellerId(rs.getInt("SELLER_ID"));
        user.setSellerName(rs.getString("SELLER_NAME"));
        user.setPasswordHash(rs.getString("PASSWORD_HASH"));
        user.setUsername(rs.getString("USERNAME"));
        user.setEmail(rs.getString("EMAIL"));
        user.setSecurityQuestion1(rs.getString("SECURITY_QUESTION1"));
        user.setSecurityAnswer1(rs.getString("SECURITY_ANSWER1"));
        user.setSecurityQuestion2(rs.getString("SECURITY_QUESTION2"));
        user.setSecurityAnswer2(rs.getString("SECURITY_ANSWER2"));
        user.setSecurityQuestion3(rs.getString("SECURITY_QUESTION3"));
        user.setSecurityAnswer3(rs.getString("SECURITY_ANSWER3"));
        Date date = rs.getDate("REGISTRY_DATE");
        user.setRegistryDate(date != null ? date.toLocalDate() : null);
        Timestamp lastLogin = rs.getTimestamp("LAST_LOGIN");
        user.setLastLogin(lastLogin != null ? lastLogin.toLocalDateTime() : null);
        user.setActive(rs.getBoolean("IS_ACTIVE"));
        return user;
    }
}