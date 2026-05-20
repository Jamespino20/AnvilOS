package hardwarehub_main.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Transaction header model (one per receipt/transaction). For per-product
 * details, see TransactionItem.
 */
public class Transaction {

    private int transactionId;
    private String buyerName;
    private String buyerAddress;
    private String buyerContact;
    private int sellerId;
    private String sellerName;
    private String transactionType;
    private String deliveryMethod;
    private LocalDate transactionDate;
    private BigDecimal grandTotal;
    private String transactionStatus;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private String paymentMethod;
    private List<TransactionItem> transactionItems = new ArrayList<>();
    private int receiptNumber;
    private int isReturned; // 0 or 1
    private Integer returnForReceiptNumber; // nullable, for returns

    public Transaction() {
    }

    public Transaction(int transactionId, String buyerName, String buyerAddress, String buyerContact, int sellerId, String sellerName, String transactionType, String deliveryMethod, LocalDate transactionDate, BigDecimal grandTotal, String transactionStatus, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt, String paymentMethod, int isReturned, Integer returnForReceiptNumber) {
        this.transactionId = transactionId;
        this.buyerName = buyerName;
        this.buyerAddress = buyerAddress;
        this.buyerContact = buyerContact;
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.transactionType = transactionType;
        this.deliveryMethod = deliveryMethod;
        this.transactionDate = transactionDate;
        this.grandTotal = grandTotal;
        this.transactionStatus = transactionStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.paymentMethod = paymentMethod;
        this.isReturned = isReturned;
        this.returnForReceiptNumber = returnForReceiptNumber;
    }

    // Getters and Setters
    public int getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(int transactionId) {
        this.transactionId = transactionId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerAddress() {
        return buyerAddress;
    }

    public void setBuyerAddress(String buyerAddress) {
        this.buyerAddress = buyerAddress;
    }

    public String getBuyerContact() {
        return buyerContact;
    }

    public void setBuyerContact(String buyerContact) {
        this.buyerContact = buyerContact;
    }

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

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public void setDeliveryMethod(String deliveryMethod) {
        this.deliveryMethod = deliveryMethod;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public String getTransactionStatus() {
        return transactionStatus;
    }

    public void setTransactionStatus(String transactionStatus) {
        this.transactionStatus = transactionStatus;
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

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public void addTransactionItem(TransactionItem item) {
        this.transactionItems.add(item);
    }

    public List<TransactionItem> getTransactionItems() {
        return transactionItems;
    }

    public int getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(int receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public int getIsReturned() {
        return isReturned;
    }

    public void setIsReturned(int isReturned) {
        this.isReturned = isReturned;
    }

    public Integer getReturnForReceiptNumber() {
        return returnForReceiptNumber;
    }

    public void setReturnForReceiptNumber(Integer num) {
        this.returnForReceiptNumber = num;
    }
}
