package hardwarehub_main.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class User {
    private int sellerId;
    private String sellerName;
    private String passwordHash;
    private String username;
    private String email;
    private String securityQuestion1;
    private String securityAnswer1;
    private String securityQuestion2;
    private String securityAnswer2;
    private String securityQuestion3;
    private String securityAnswer3;
    private LocalDate registryDate;
    private LocalDateTime lastLogin;
    private boolean isActive;
    private static User currentUser;

    // Constructors
    public User() {}

    public User(int sellerId, String sellerName, String passwordHash, String username, String email,
                String securityQuestion1, String securityAnswer1, String securityQuestion2, String securityAnswer2, String securityQuestion3, String securityAnswer3,
                LocalDate registryDate, LocalDateTime lastLogin, boolean isActive) {
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.passwordHash = passwordHash;
        this.username = username;
        this.email = email;
        this.securityQuestion1 = securityQuestion1;
        this.securityAnswer1 = securityAnswer1;
        this.securityQuestion2 = securityQuestion2;
        this.securityAnswer2 = securityAnswer2;
        this.securityQuestion3 = securityQuestion3;
        this.securityAnswer3 = securityAnswer3;
        this.registryDate = registryDate;
        this.lastLogin = lastLogin;
        this.isActive = isActive;
    }

    // Getters and Setters
    public int getSellerId() {
        return sellerId;
    }

    public void setSellerId(int sellerId) {
        this.sellerId = sellerId;
    }

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSecurityQuestion1() {
        return securityQuestion1;
    }

    public void setSecurityQuestion1(String securityQuestion1) {
        this.securityQuestion1 = securityQuestion1;
    }

    public String getSecurityAnswer1() {
        return securityAnswer1;
    }

    public void setSecurityAnswer1(String securityAnswer1) {
        this.securityAnswer1 = securityAnswer1;
    }

    public String getSecurityQuestion2() {
        return securityQuestion2;
    }

    public void setSecurityQuestion2(String securityQuestion2) {
        this.securityQuestion2 = securityQuestion2;
    }

    public String getSecurityAnswer2() {
        return securityAnswer2;
    }

    public void setSecurityAnswer2(String securityAnswer2) {
        this.securityAnswer2 = securityAnswer2;
    }

    public String getSecurityQuestion3() {
        return securityQuestion3;
    }

    public void setSecurityQuestion3(String securityQuestion3) {
        this.securityQuestion3 = securityQuestion3;
    }

    public String getSecurityAnswer3() {
        return securityAnswer3;
    }

    public void setSecurityAnswer3(String securityAnswer3) {
        this.securityAnswer3 = securityAnswer3;
    }

    public LocalDate getRegistryDate() {
        return registryDate;
    }

    public void setRegistryDate(LocalDate registryDate) {
        this.registryDate = registryDate;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean isActive) {
        this.isActive = isActive;
    }

    public static User getCurrentUser() {
        return currentUser;
    }

    public static void setCurrentUser(User user) {
        currentUser = user;
    }

    public static String getSellerNameById(int sellerId) {
        hardwarehub_main.model.User user = hardwarehub_main.dao.UserDAO.getUserBySellerId(sellerId);
        return user != null ? user.getSellerName() : "";
    }
}