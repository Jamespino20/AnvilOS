package hardwarehub_main.model;

import java.time.LocalDateTime;

public class AuditLog {
    private int logId;
    private int sellerId;
    private LocalDateTime logTime;
    private boolean successStatus;
    private String panel;
    private String action;
    private String details;

    public AuditLog() {}

    public AuditLog(int logId, int sellerId, LocalDateTime logTime, boolean successStatus, String panel, String action, String details) {
        this.logId = logId;
        this.sellerId = sellerId;
        this.logTime = logTime;
        this.successStatus = successStatus;
        this.panel = panel;
        this.action = action;
        this.details = details;
    }

    public int getLogId() {
        return logId;
    }

    public void setLogId(int logId) {
        this.logId = logId;
    }

    public int getSellerId() {
        return sellerId;
    }

    public void setSellerId(int sellerId) {
        this.sellerId = sellerId;
    }

    public LocalDateTime getLogTime() {
        return logTime;
    }

    public void setLogTime(LocalDateTime logTime) {
        this.logTime = logTime;
    }

    public boolean isSuccessStatus() {
        return successStatus;
    }

    public void setSuccessStatus(boolean successStatus) {
        this.successStatus = successStatus;
    }

    public String getPanel() {
        return panel;
    }

    public void setPanel(String panel) {
        this.panel = panel;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }
    
    public void setDetails(String details) {
        this.details = details;
    }
} 