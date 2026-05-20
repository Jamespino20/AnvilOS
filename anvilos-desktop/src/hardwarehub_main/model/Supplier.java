package hardwarehub_main.model;

public class Supplier {

    private int supplierId;
    private String supplierName;
    private String contactName;
    private String contactNumber;
    private String email;
    private String address;
    private boolean isAvailable;

    public Supplier() {
    }

    public Supplier(int supplierId, String supplierName, String contactName, String contactNumber, String email, String address) {
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.contactName = contactName;
        this.contactNumber = contactNumber;
        this.email = email;
        this.address = address;
    }

    public Supplier(int supplierId, String supplierName, String contactName, String contactNumber, String email, String address, boolean isAvailable) {
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.contactName = contactName;
        this.contactNumber = contactNumber;
        this.email = email;
        this.address = address;
        this.isAvailable = isAvailable;
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

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    public void setAvailable(boolean isAvailable) {
        this.isAvailable = isAvailable;
    }
}
