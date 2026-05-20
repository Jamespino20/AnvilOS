package hardwarehub_main.model;

import java.time.LocalDateTime;

public class Notification {

    private int notificationID;
    private String systemNotification;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
    private boolean dynamic;

    // Full constructor for loading existing notifications from DB
    public Notification(int id, String systemNotification, String message, boolean isRead, LocalDateTime createdAt) {
        this.notificationID = id;
        this.systemNotification = systemNotification;
        this.message = message;
        this.isRead = isRead;
        this.createdAt = createdAt;
        // Determines if notification is dynamic based on systemNotification prefix
        this.dynamic = systemNotification != null
                && (systemNotification.startsWith("Stock_") || systemNotification.startsWith("Transaction_"));
    }

    // Convenience constructor for creating *new* notifications (before they have a DB-generated ID)
    public Notification(String systemNotification, String message, boolean isRead, LocalDateTime createdAt) {
        this(0, systemNotification, message, isRead, createdAt); // ID 0 indicates a new, unsaved notification
    }

    // Default constructor (if needed, though parameterized constructors are generally preferred)
    public Notification() {
        this(0, null, null, false, null);
    }

    // Getters & setters
    public int getNotificationID() {
        return notificationID;
    }

    public void setNotificationID(int id) {
        this.notificationID = id;
    }

    public String getSystemNotification() {
        return systemNotification;
    }

    public void setSystemNotification(String systemNotification) {
        this.systemNotification = systemNotification;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isDynamic() {
        return dynamic;
    }

    public void setDynamic(boolean dynamic) {
        this.dynamic = dynamic;
    }
}
