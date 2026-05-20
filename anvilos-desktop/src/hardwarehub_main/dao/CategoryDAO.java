package hardwarehub_main.dao;

import hardwarehub_main.model.Category;
import hardwarehub_main.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CategoryDAO {

    public static boolean insertCategory(Category category) {
        String sql = "INSERT INTO categories (CATEGORY, PARENT_CATEGORY_ID, IS_AVAILABLE, CREATED_AT, UPDATED_AT) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, category.getCategory());
            if (category.getParentCategoryId() != null) stmt.setInt(2, category.getParentCategoryId());
            else stmt.setNull(2, Types.INTEGER);
            stmt.setBoolean(3, category.isAvailable());
            stmt.setTimestamp(4, category.getCreatedAt() != null ? Timestamp.valueOf(category.getCreatedAt()) : null);
            stmt.setTimestamp(5, category.getUpdatedAt() != null ? Timestamp.valueOf(category.getUpdatedAt()) : null);
            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            System.err.println("[CategoryDAO] insertCategory error: " + e.getMessage());
            return false;
        }
    }

    public static List<Category> getAllCategories() {
        List<Category> categories = new ArrayList<>();
        String sql = "SELECT * FROM categories ORDER BY CATEGORY ASC";

        try (Connection conn = DBConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                categories.add(extractCategoryFromResultSet(rs));
            }

        } catch (SQLException e) {
            System.err.println("[CategoryDAO] getAllCategories error: " + e.getMessage());
        }

        return categories;
    }

    public static Category getCategoryById(int categoryId) {
        String sql = "SELECT * FROM categories WHERE CATEGORY_ID = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, categoryId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return extractCategoryFromResultSet(rs);
                }
            }

        } catch (SQLException e) {
            System.err.println("[CategoryDAO] getCategoryById error: " + e.getMessage());
        }

        return null;
    }

    public static boolean updateCategory(Category category) {
        String sql = "UPDATE categories SET CATEGORY = ?, PARENT_CATEGORY_ID = ?, IS_AVAILABLE = ?, UPDATED_AT = ? WHERE CATEGORY_ID = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, category.getCategory());
            if (category.getParentCategoryId() != null) stmt.setInt(2, category.getParentCategoryId());
            else stmt.setNull(2, Types.INTEGER);
            stmt.setBoolean(3, category.isAvailable());
            stmt.setTimestamp(4, category.getUpdatedAt() != null ? Timestamp.valueOf(category.getUpdatedAt()) : null);
            stmt.setInt(5, category.getCategoryId());

            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            System.err.println("[CategoryDAO] updateCategory error: " + e.getMessage());
            return false;
        }
    }

    public static boolean deleteCategory(int categoryId) {
        String sql = "DELETE FROM categories WHERE CATEGORY_ID = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, categoryId);
            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            System.err.println("[CategoryDAO] deleteCategory error: " + e.getMessage());
            return false;
        }
    }

    private static Category extractCategoryFromResultSet(ResultSet rs) throws SQLException {
        Category category = new Category();
        category.setCategoryId(rs.getInt("CATEGORY_ID"));
        category.setCategory(rs.getString("CATEGORY"));
        int parentId = rs.getInt("PARENT_CATEGORY_ID");
        category.setParentCategoryId(rs.wasNull() ? null : parentId);
        category.setAvailable(rs.getBoolean("IS_AVAILABLE"));
        Timestamp created = rs.getTimestamp("CREATED_AT");
        Timestamp updated = rs.getTimestamp("UPDATED_AT");
        category.setCreatedAt(created != null ? created.toLocalDateTime() : null);
        category.setUpdatedAt(updated != null ? updated.toLocalDateTime() : null);
        return category;
    }
}
