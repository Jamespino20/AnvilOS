package hardwarehub_main.dao;

import hardwarehub_main.model.Supplier;
import hardwarehub_main.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SupplierDAO {

    public static boolean insertSupplier(Supplier supplier) {
        // If supplierId > 0, insert with explicit SUPPLIER_ID (for import/overwrite mode)
        if (supplier.getSupplierId() > 0) {
            String sql = "INSERT INTO suppliers (SUPPLIER_ID, SUPPLIER_NAME, CONTACT_NAME, CONTACT_NUMBER, EMAIL, ADDRESS, IS_AVAILABLE) VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, supplier.getSupplierId());
                stmt.setString(2, supplier.getSupplierName());
                stmt.setString(3, supplier.getContactName());
                stmt.setString(4, supplier.getContactNumber());
                stmt.setString(5, supplier.getEmail());
                stmt.setString(6, supplier.getAddress());
                stmt.setBoolean(7, supplier.isAvailable());
                return stmt.executeUpdate() > 0;
            } catch (SQLException e) {
                System.err.println("[SupplierDAO] insertSupplier (explicit ID) error: " + e.getMessage());
                return false;
            }
        }
        String sql = "INSERT INTO suppliers (SUPPLIER_NAME, CONTACT_NAME, CONTACT_NUMBER, EMAIL, ADDRESS, IS_AVAILABLE) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, supplier.getSupplierName());
            stmt.setString(2, supplier.getContactName());
            stmt.setString(3, supplier.getContactNumber());
            stmt.setString(4, supplier.getEmail());
            stmt.setString(5, supplier.getAddress());
            stmt.setBoolean(6, supplier.isAvailable());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[SupplierDAO] insertSupplier error: " + e.getMessage());
            return false;
        }
    }

    public static List<Supplier> getAllSuppliers() {
        List<Supplier> suppliers = new ArrayList<>();
        String sql = "SELECT * FROM suppliers ORDER BY SUPPLIER_NAME ASC";
        try (Connection conn = DBConnection.getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                suppliers.add(extractSupplierFromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("[SupplierDAO] getAllSuppliers error: " + e.getMessage());
        }
        return suppliers;
    }

    public static Supplier getSupplierById(int id) {
        String sql = "SELECT * FROM suppliers WHERE SUPPLIER_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return extractSupplierFromResultSet(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[SupplierDAO] getSupplierById error: " + e.getMessage());
        }
        return null;
    }

    public static List<String> getAllSupplierNames() {
        List<String> names = new ArrayList<>();
        for (Supplier s : getAllSuppliers()) {
            names.add(s.getSupplierName());
        }
        return names;
    }

    public static int getSupplierIdByName(String name) {
        String sql = "SELECT SUPPLIER_ID FROM suppliers WHERE SUPPLIER_NAME = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, name);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("SUPPLIER_ID");
                }
            }
        } catch (SQLException e) {
            System.err.println("[SupplierDAO] getSupplierIdByName error: " + e.getMessage());
        }
        return -1;
    }

    public static boolean updateSupplier(Supplier supplier) {
        String sql = "UPDATE suppliers SET SUPPLIER_NAME = ?, CONTACT_NAME = ?, CONTACT_NUMBER = ?, EMAIL = ?, ADDRESS = ?, IS_AVAILABLE = ? WHERE SUPPLIER_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, supplier.getSupplierName());
            stmt.setString(2, supplier.getContactName());
            stmt.setString(3, supplier.getContactNumber());
            stmt.setString(4, supplier.getEmail());
            stmt.setString(5, supplier.getAddress());
            stmt.setBoolean(6, supplier.isAvailable());
            stmt.setInt(7, supplier.getSupplierId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[SupplierDAO] updateSupplier error: " + e.getMessage());
            return false;
        }
    }

    public static boolean deleteSupplier(int id) {
        String sql = "DELETE FROM suppliers WHERE SUPPLIER_ID = ?";
        try (Connection conn = DBConnection.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("[SupplierDAO] deleteSupplier error: " + e.getMessage());
            return false;
        }
    }

    private static Supplier extractSupplierFromResultSet(ResultSet rs) throws SQLException {
        Supplier supplier = new Supplier();
        supplier.setSupplierId(rs.getInt("SUPPLIER_ID"));
        supplier.setSupplierName(rs.getString("SUPPLIER_NAME"));
        supplier.setContactName(rs.getString("CONTACT_NAME"));
        supplier.setContactNumber(rs.getString("CONTACT_NUMBER"));
        supplier.setEmail(rs.getString("EMAIL"));
        supplier.setAddress(rs.getString("ADDRESS"));
        supplier.setAvailable(rs.getBoolean("IS_AVAILABLE"));
        return supplier;
    }
}
