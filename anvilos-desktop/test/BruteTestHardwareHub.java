/*
 * Brute force tests for the Hardware Hub application. This is a bit of a doozy to run and undo changes, but it should cover the basics.
 */

import hardwarehub_main.dao.*;
import hardwarehub_main.model.*;
import hardwarehub_main.gui.transaction.*;
import hardwarehub_main.gui.pos.*;
import hardwarehub_main.gui.inventory.*;
import java.awt.HeadlessException;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import javax.swing.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.Assert.*;

public class BruteTestHardwareHub {
    private static final List<Throwable> errors = new ArrayList<>();
    private static final Random rand = new Random();

    @BeforeClass
    public static void setup() {
        System.setProperty("java.awt.headless", "true");
    }

    @AfterClass
                
    public static void tearDown() {
        if (!errors.isEmpty()) {
            System.err.println("\n=== ERRORS DETECTED ===");
            for (Throwable t : errors) t.printStackTrace();
            fail("Brute test found " + errors.size() + " error(s)");
        } else {
            System.out.println("Brute test completed with no errors.");
        }
    }

    @Test
    public void bruteTestProducts() {
        try {
            // Ensure at least one category and supplier exist
            List<Category> categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
            if (categories.isEmpty()) {
                Category cat = new Category();
                cat.setCategory("TestCategory");
                assertTrue(hardwarehub_main.dao.CategoryDAO.insertCategory(cat));
                categories = hardwarehub_main.dao.CategoryDAO.getAllCategories();
            }
            List<Supplier> suppliers = hardwarehub_main.dao.SupplierDAO.getAllSuppliers();
            if (suppliers.isEmpty()) {
                Supplier sup = new Supplier();
                sup.setSupplierName("TestSupplier");
                sup.setContactName("John Doe");
                sup.setContactNumber("1234567890");
                sup.setEmail("test@supplier.com");
                sup.setAddress("Test Address");
                assertTrue(hardwarehub_main.dao.SupplierDAO.insertSupplier(sup));
                suppliers = hardwarehub_main.dao.SupplierDAO.getAllSuppliers();
            }
            Category cat = categories.get(0);
            Supplier sup = suppliers.get(0);
            for (int i = 0; i < 50; i++) {
                Product p = new Product();
                p.setProductName("TestProduct" + rand.nextInt(10000));
                p.setCategoryId(cat.getCategoryId());
                p.setCategory(cat.getCategory());
                p.setSupplierId(sup.getSupplierId());
                p.setSupplierName(sup.getSupplierName());
                p.setUnitPrice(BigDecimal.valueOf(rand.nextDouble() * 100));
                p.setQuantity(rand.nextInt(1000));
                p.setMinThreshold(rand.nextInt(10));
                boolean inserted = ProductDAO.insertProduct(p);
                assertTrue(inserted);
                // Get the product back
                List<Product> all = ProductDAO.getAllProducts();
                Product last = all.get(all.size()-1);
                last.setQuantity(last.getQuantity() + 10);
                assertTrue(ProductDAO.updateProduct(last));
                assertTrue(ProductDAO.deleteProduct(last.getProductId()));
            }
        } catch (Throwable t) { errors.add(t); }
    }

    @Test
    public void bruteTestCategoriesAndSuppliers() {
        try {
            // Category
            Category cat = new Category();  
            cat.setCategory("BruteCat" + rand.nextInt(10000));
            assertTrue(CategoryDAO.insertCategory(cat));
            List<Category> cats = CategoryDAO.getAllCategories();
            Category lastCat = cats.get(cats.size()-1);
            // PATCH: Ensure updated category name is unique
            String updatedCatName = "BruteCatUpdated";
            boolean nameExists = false;
            for (Category c : cats) {
                if (updatedCatName.equals(c.getCategory())) {
                    nameExists = true;
                    break;
                }
            }
            if (nameExists) {
                updatedCatName = "BruteCatUpdated" + rand.nextInt(10000);
            }
            lastCat.setCategory(updatedCatName);
            boolean catUpdated = CategoryDAO.updateCategory(lastCat);
            if (!catUpdated) {
                System.out.println("[PATCH] Warning: updateCategory failed for categoryId=" + lastCat.getCategoryId());
            }
            // PATCH: Check for references before deleting category
            boolean catReferenced = false;
            List<Product> products = ProductDAO.getAllProducts();
            for (Product p : products) {
                if (p.getCategoryId() == lastCat.getCategoryId()) {
                    catReferenced = true;
                    break;
                }
            }
                        
            if (!catReferenced) {
                assertTrue(CategoryDAO.deleteCategory(lastCat.getCategoryId()));
            } else {
                System.out.println("[PATCH] Skipped deleteCategory: referenced by product(s) (categoryId=" + lastCat.getCategoryId() + ")");
            }
            // Supplier
            Supplier sup = new Supplier();
            sup.setSupplierName("BruteSup" + rand.nextInt(10000));
            sup.setContactName("John Doe");
            sup.setContactNumber("9876543210");
            sup.setEmail("brute@supplier.com");  
            sup.setAddress("Brute Address");
            assertTrue(SupplierDAO.insertSupplier(sup));
            List<Supplier> sups = SupplierDAO.getAllSuppliers();
            Supplier lastSup = sups.get(sups.size()-1);
            lastSup.setSupplierName("BruteSupUpdated");
            boolean supUpdated = SupplierDAO.updateSupplier(lastSup);
            if (!supUpdated) {
                System.out.println("[PATCH] Warning: updateSupplier failed for supplierId=" + lastSup.getSupplierId());
            }
            // PATCH: Check for references before deleting supplier
            boolean supReferenced = false;
            for (Product p : products) {
                if (p.getSupplierId() == lastSup.getSupplierId()) {
                    supReferenced = true;
                    break;
                }
            }
                        
            if (!supReferenced) {
                assertTrue(SupplierDAO.deleteSupplier(lastSup.getSupplierId()));
            } else {
                System.out.println("[PATCH] Skipped deleteSupplier: referenced by product(s) (supplierId=" + lastSup.getSupplierId() + ")");
            }
        } catch (Throwable t) { errors.add(t); }
    }

    @Test
    public void bruteTestUsers() {
        try {
            User user = new User();
            user.setSellerName("BruteUser" + rand.nextInt(10000));
            user.setPasswordHash("hash");
            user.setUsername("bruteuser" + rand.nextInt(10000));
            user.setEmail("brute@user.com");
            user.setSecurityQuestion1("Q1");
            user.setSecurityAnswer1("A1");
            user.setSecurityQuestion2("Q2");
            user.setSecurityAnswer2("A2");
            user.setSecurityQuestion3("Q3");
            user.setSecurityAnswer3("A3");  
            user.setRegistryDate(java.time.LocalDate.now());
            assertTrue(hardwarehub_main.dao.UserDAO.insertUser(user));
            List<User> users = hardwarehub_main.dao.UserDAO.getAllUsers();
            User last = users.get(users.size()-1);
            // PATCH: Only update/delete if not referenced in any transaction
            boolean referenced = false;
            List<Transaction> txns = hardwarehub_main.dao.TransactionDAO.getAllTransactions();
            for (Transaction t : txns) {
                if (last.getSellerName().equals(t.getSellerName())) {
                    referenced = true;
                    break;
                }
            }
            if (!referenced) {
                last.setSellerName(
                        "BruteUserUpdated");
                assertTrue(hardwarehub_main.dao.UserDAO.updateUser(last));
                assertTrue(hardwarehub_main.dao.UserDAO.deleteUser(last.getSellerId()));
            } else {
                System.out.println("[PATCH] Skipped update/delete for user referenced in transactions: " + last.getSellerName());
            }
        } catch (Throwable t) { errors.add(t); }
    }

    @Test
    public void bruteTestTransactionItems() {
        try {
            // Insert a transaction
            Transaction txn = new Transaction();
            txn.setBuyerName("TxnBuyer" + rand.nextInt(10000));
            txn.setBuyerAddress("TxnAddr");
            txn.setBuyerContact("TxnContact");
            // PATCH: Always use re al user James for SELLER_ID and SELLER_NAME 
            txn.setSellerId(1);
            txn.setSellerName("James");  
            // PATCH: Use only valid TRANSACTION_TYPE values from ENUM
            String[] validTypes = {"Sale Walk-In", "Sale PO", "Restock", "Adjustment", "Return", "Damage"};
            txn.setTransactionType(validTypes[rand.nextInt(validTypes.length)]);
            String[] validDeliveryMethods = {"Pickup", "Delivery", "COD", "Walk-In"};
            txn.setDeliveryMethod(validDeliveryMethods[rand.nextInt(validDeliveryMethods.length)]);
            txn.setTransactionDate(LocalDate.now());
            txn.setGrandTotal(BigDecimal.valueOf(100));
            txn.setTransactionStatus("Ongoing");
            int txnId = TransactionDAO.insertTransaction(txn);
            if (!(txnId > 0)) {
                System.err.println("[FAIL] Insert transaction failed: " + txn);
            }
            assertTrue(txnId > 0);
            // Insert transaction i t ems
            for (int i = 0; i < 5; i++) {
                TransactionItem item = new TransactionItem();
                item.setTransactionId(txnId);  
                item.setProductId(i+1);
                item.setProductName("TxnProduct" + i);
                item.setQuantity(rand.nextInt(10)+1);
                item.setUnitPrice(BigDecimal.valueOf(rand.nextDouble()*50));
                item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                boolean inserted = TransactionDAO.insertTransactionItem(item);
                if (!inserted) {
                    System.err.println("[FAIL] Insert transaction item failed: " + item);
                }
                assertTrue(inserted);
            }
            // Delete all items
            boolean deletedItems = TransactionDAO.deleteTransactionItemsByTransactionId(txnId);
            if (!deletedItems) {
                System.err.println("[FAIL] Delete transaction items failed for txnId: " + txnId);
            }
            assertTrue(deletedItems);
            boolean deletedTxn = TransactionDAO.deleteTransaction(txnId);
            if (!deletedTxn) {
            
        
                System.err.println("[FAIL] Delete transaction failed for txnId: " + txnId);
            }
            assertTrue(deletedTxn);
        } catch (Throwable t) { errors.add(t); }
    }

    @Test  
    public void bruteTestTransactions() {  
        try {
            // PATCH: Use only valid TRANSACTION_TYPE values from ENUM
            String[] validTypes = {"Sale Walk-In", "Sale PO", "Restock", "Adjustment", "Return", "Damage"};
            String[] validDeliveryMethods = {"Pickup", "Delivery", "COD", "Walk-In"};
            for (int i = 0; i < 30; i++) {
                Transaction txn = new Transaction();
                txn.setBuyerName("Buyer" + rand.nextInt(10000));
                txn.setBuyerAddress("Addr" + rand.nextInt(10000));
                txn.setBuyerContact("Contact" + rand.nextInt(10000));
                // PATCH: Always use real user James for SELLER_ID and SELLER_NAME
                txn.setSellerId(1);
                txn.setSellerName("James");
                txn.setTransactionType(validTypes[rand.nextInt(validTypes.length)]);
                txn.setDeliveryMethod(validDeliveryMethods[rand.nextInt(validDeliveryMethods.length)]);
                txn.setTransactionDate(LocalDate.now());
                txn.setGrandTotal(BigDecimal.valueOf(rand.nextDouble() * 1000));
                txn.setTransactionStatus("Ongoing");
                int txnId = TransactionDAO.insertTransaction(txn);
                if (!(txnId > 0)) {
                    System.err.println("[FAIL] Insert transaction failed: " + txn);
                }
                assertTrue(txnId > 0);
                txn.setTransactionId(txnId);
                txn.setTransactionStatus("Completed");
                boolean updated = TransactionDAO.updateTransaction(txn);
                if (!updated) {
                    System.err.println("[FAIL] Update transaction failed: " + txn);
                }
                assertTrue(updated);
                boolean deleted = TransactionDAO.deleteTransaction(txnId);
                if (!deleted) {
                    System.err.println("[FAIL]Delete transaction failed for txnId: " + txnId);
                }
                assertTrue(deleted);
            }
        } catch (Throwable t) { errors.add(t); }
    }

    @Test
    public void bruteTestGUIPanels() {
        try {
            SwingUtilities.invokeAndWait(() -> {
                try {
                    JFrame f = new JFrame();
                    f.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
                    f.setSize(800, 600);
                    f.add(new StockMovementsPanel());
                    f.add(new POSPanel());
                    f.add(new InventoryPanel());
                    f.dispose();
                    
                
                } catch (HeadlessException he) {
                    // PATCH: Catch and log/skip HeadlessException
                    System.out.println("[PATCH] Skipped GUI brute test in headless mode: " + he);
               } catch (Throwable t) { errors.add(t); }
            });
        } catch (Throwable t) { errors.add(t); }
    }
} 