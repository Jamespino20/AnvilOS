package hardwarehub_main.dao;

import hardwarehub_main.model.Product;
import hardwarehub_main.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ProductDAO {

    private static List<Product> productCache = null;
    private static long lastCacheTime = 0;
    private static final long CACHE_TTL_MS = 10000; // 10 seconds

    public static boolean insertProduct(Product product) {
        // Ensure timestamps are set
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (product.getCreatedAt() == null) {
            product.setCreatedAt(now);
        }
        if (product.getUpdatedAt() == null) {
            product.setUpdatedAt(now);
        }
        // If productId > 0, insert with explicit PRODUCT_ID (for import/overwrite mode)
        if (product.getProductId() > 0) {
            String sql = "INSERT INTO products (PRODUCT_ID, PRODUCT_NAME, CATEGORY_ID, CATEGORY, SUPPLIER_ID, SUPPLIER_NAME, UNIT_PRICE, QUANTITY, MIN_THRESHOLD, IS_AVAILABLE, CREATED_AT, UPDATED_AT) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, product.getProductId());
                stmt.setString(2, product.getProductName());
                stmt.setInt(3, product.getCategoryId());
                stmt.setString(4, product.getCategory());
                stmt.setInt(5, product.getSupplierId());
                stmt.setString(6, product.getSupplierName());
                stmt.setBigDecimal(7, product.getUnitPrice());
                stmt.setInt(8, product.getQuantity());
                stmt.setInt(9, product.getMinThreshold());
                stmt.setBoolean(10, product.isAvailable());
                stmt.setTimestamp(11, product.getCreatedAt() != null ? Timestamp.valueOf(product.getCreatedAt()) : null);
                stmt.setTimestamp(12, product.getUpdatedAt() != null ? Timestamp.valueOf(product.getUpdatedAt()) : null);
                return stmt.executeUpdate() > 0;
            } catch (SQLException e) {
                System.err.println("[ProductDAO] insertProduct (explicit ID) error: " + e.getMessage());
                return false;
            }
        }
        String sql = "INSERT INTO products (PRODUCT_NAME, CATEGORY_ID, CATEGORY, SUPPLIER_ID, SUPPLIER_NAME, UNIT_PRICE, QUANTITY, MIN_THRESHOLD, IS_AVAILABLE, CREATED_AT, UPDATED_AT) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, product.getProductName());
            stmt.setInt(2, product.getCategoryId());
            stmt.setString(3, product.getCategory());
            stmt.setInt(4, product.getSupplierId());
            stmt.setString(5, product.getSupplierName());
            stmt.setBigDecimal(6, product.getUnitPrice());
            stmt.setInt(7, product.getQuantity());
            stmt.setInt(8, product.getMinThreshold());
            stmt.setBoolean(9, product.isAvailable());
            stmt.setTimestamp(10, product.getCreatedAt() != null ? Timestamp.valueOf(product.getCreatedAt()) : null);
            stmt.setTimestamp(11, product.getUpdatedAt() != null ? Timestamp.valueOf(product.getUpdatedAt()) : null);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[ProductDAO] insertProduct error: " + e.getMessage());
            return false;
        }
    }

    public static List<String> getAllCategories() {
        List<String> categories = new ArrayList<>();
        String sql = "SELECT DISTINCT CATEGORY FROM products ORDER BY CATEGORY ASC";

        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                categories.add(rs.getString("CATEGORY"));
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return categories;
    }

    public static List<Product> getAllProducts() {
        long now = System.currentTimeMillis();
        if (productCache == null || (now - lastCacheTime) > CACHE_TTL_MS) {
            productCache = fetchAllProducts();
            lastCacheTime = now;
        }
        return productCache;
    }

    public static void refreshProductCache() {
        productCache = fetchAllProducts();
        lastCacheTime = System.currentTimeMillis();
    }

    private static List<Product> fetchAllProducts() {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT * FROM products ORDER BY PRODUCT_ID ASC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                products.add(extractProductFromResultSet(rs));
            }
        } catch (SQLException e) { System.err.println("[ProductDAO] getAllProducts error: " + e.getMessage()); }
        return products;
    }

    public static Product getProductById(int id) {
        String sql = "SELECT * FROM products WHERE PRODUCT_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return extractProductFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[ProductDAO] getProductById error: " + e.getMessage());
        }
        return null;
    }

    public static List<Product> getProductsByCategory(String category) {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT * FROM products WHERE CATEGORY = ? ORDER BY PRODUCT_NAME ASC";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, category);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    products.add(extractProductFromResultSet(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("[ProductDAO] getProductsByCategory error: " + e.getMessage());
        }
        return products;
    }

    // Lookup a category's ID by its exact name
    public static int getCategoryIdByName(String category) {
        String sql = "SELECT CATEGORY_ID FROM categories WHERE CATEGORY = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, category);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("CATEGORY_ID");
                }
            }
        } catch (SQLException e) {
            System.err.println("[ProductDAO] getCategoryIdByName error: " + e.getMessage());
        }
        return -1;
    }

    public static boolean updateProduct(Product product) {
        String sql = "UPDATE products SET PRODUCT_NAME = ?, CATEGORY_ID = ?, CATEGORY = ?, SUPPLIER_ID = ?, SUPPLIER_NAME = ?, "
                + "UNIT_PRICE = ?, QUANTITY = ?, MIN_THRESHOLD = ?, IS_AVAILABLE = ?, UPDATED_AT = ? WHERE PRODUCT_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, product.getProductName());
            stmt.setInt(2, product.getCategoryId());
            stmt.setString(3, product.getCategory());
            stmt.setInt(4, product.getSupplierId());
            stmt.setString(5, product.getSupplierName());
            stmt.setBigDecimal(6, product.getUnitPrice());
            stmt.setInt(7, product.getQuantity());
            stmt.setInt(8, product.getMinThreshold());
            stmt.setBoolean(9, product.isAvailable());
            stmt.setTimestamp(10, product.getUpdatedAt() != null ? Timestamp.valueOf(product.getUpdatedAt()) : null);
            stmt.setInt(11, product.getProductId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[ProductDAO] updateProduct error: " + e.getMessage());
            return false;
        }
    }

    public static boolean deleteProduct(int id) {
        String sql = "DELETE FROM products WHERE PRODUCT_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[ProductDAO] deleteProduct error: " + e.getMessage());
            return false;
        }
    }

    public static List<Product> getProductsByCategoryIds(Set<Integer> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        StringBuilder sb = new StringBuilder("SELECT * FROM products WHERE category_id IN (");
        for (int i = 0; i < categoryIds.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append("?");
        }
        sb.append(")");
        List<Product> result = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sb.toString())) {
            int idx = 1;
            for (Integer id : categoryIds) {
                stmt.setInt(idx++, id);
            }
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                result.add(extractProductFromResultSet(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    private static Product extractProductFromResultSet(ResultSet rs) throws SQLException {
        Product product = new Product();
        product.setProductId(rs.getInt("PRODUCT_ID"));
        product.setProductName(rs.getString("PRODUCT_NAME"));
        product.setCategoryId(rs.getInt("CATEGORY_ID"));
        product.setCategory(rs.getString("CATEGORY"));
        product.setSupplierId(rs.getInt("SUPPLIER_ID"));
        product.setSupplierName(rs.getString("SUPPLIER_NAME"));
        product.setUnitPrice(rs.getBigDecimal("UNIT_PRICE"));
        product.setQuantity(rs.getInt("QUANTITY"));
        product.setMinThreshold(rs.getInt("MIN_THRESHOLD"));
        product.setAvailable(rs.getBoolean("IS_AVAILABLE"));
        Timestamp created = rs.getTimestamp("CREATED_AT");
        Timestamp updated = rs.getTimestamp("UPDATED_AT");
        product.setCreatedAt(created != null ? created.toLocalDateTime() : null);
        product.setUpdatedAt(updated != null ? updated.toLocalDateTime() : null);
        return product;
    }
}
