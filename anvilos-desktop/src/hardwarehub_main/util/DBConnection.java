package hardwarehub_main.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/db_hardwarehub";
    private static final String USER = "root"; 
    private static final String PASSWORD = "";

    private static Connection connection;

    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            try {
                Class.forName("com.mysql.cj.jdbc.Driver");
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
                System.out.println("✅ Connected to MySQL.");
            } catch (ClassNotFoundException e) {
                System.err.println("❌ JDBC Driver not found.");
                e.printStackTrace();
            }
        }
        return connection;
    }
}
