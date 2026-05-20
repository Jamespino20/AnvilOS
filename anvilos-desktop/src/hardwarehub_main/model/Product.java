package hardwarehub_main.model;

import java.math.BigDecimal;

public class Product {

    private int productId;
    private String productName;
    private int categoryId;
    private String category;
    private int supplierId;
    private String supplierName;
    private BigDecimal unitPrice;
    private int quantity;
    private int minThreshold;
    private boolean isAvailable;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    public Product() {
    }

    public Product(int productId, String productName, int categoryId, String category, int supplierId, String supplierName,
            BigDecimal unitPrice, int quantity, int minThreshold, boolean isAvailable, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt) {
        this.productId = productId;
        this.productName = productName;
        this.categoryId = categoryId;
        this.category = category;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.minThreshold = minThreshold;
        this.isAvailable = isAvailable;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public int getProductId() {
        return productId;
    }

    public void setProductId(int productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(int categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(int supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public int getMinThreshold() {
        return minThreshold;
    }

    public void setMinThreshold(int minThreshold) {
        this.minThreshold = minThreshold;
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    public void setAvailable(boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.time.LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
