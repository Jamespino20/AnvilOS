package hardwarehub_main.model;

public class Category {

    private int categoryId;
    private String category;
    private Integer parentCategoryId;
    private boolean isAvailable;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    public Category() {
    }

    public Category(int categoryId, String category, Integer parentCategoryId, boolean isAvailable, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt) {
        this.categoryId = categoryId;
        this.category = category;
        this.parentCategoryId = parentCategoryId;
        this.isAvailable = isAvailable;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public Integer getParentCategoryId() {
        return parentCategoryId;
    }

    public void setParentCategoryId(Integer parentCategoryId) {
        this.parentCategoryId = parentCategoryId;
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
