package hardwarehub_main.gui.inventory;

import hardwarehub_main.dao.SupplierDAO;
import hardwarehub_main.model.Supplier;
import hardwarehub_main.util.DialogUtils;
import hardwarehub_main.util.UIConstants;
import java.awt.*;
import javax.swing.*;
import javax.swing.border.EmptyBorder;

/**
 * Dialog for adding or editing a Supplier.
 */
public class SupplierDialog extends JDialog {
    private boolean succeeded;
    private final Supplier supplier;

    private JTextField tfName, tfContactName, tfContactNumber, tfEmail, tfAddress;

    public SupplierDialog(Window owner, Supplier sup) {
        super(owner, (sup == null ? "Add Supplier" : "Edit Supplier"), ModalityType.APPLICATION_MODAL);
        this.supplier = sup;
        initComponents();
        if (sup != null) {
            loadSupplierData();
        }
        pack();
        setLocationRelativeTo(owner);
        DialogUtils.bindEscapeKeyToClose(this);

    }

    private void initComponents() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(UIConstants.PANEL_BG);
        panel.setBorder(new EmptyBorder(10, 10, 10, 10));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5,5,5,5);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JLabel lblName = new JLabel("Name:");
        JLabel lblContactName = new JLabel("Contact Name:");
        JLabel lblContactNumber = new JLabel("Contact Number:");
        JLabel lblEmail = new JLabel("Email:");
        JLabel lblAddress = new JLabel("Address:");

        tfName = new JTextField(20);
        tfContactName = new JTextField(20);
        tfContactNumber = new JTextField(20);
        tfEmail = new JTextField(20);
        tfAddress = new JTextField(20);

        gbc.gridx = 0; gbc.gridy = 0; panel.add(lblName, gbc);
        gbc.gridx = 1; panel.add(tfName, gbc);
        gbc.gridx = 0; gbc.gridy = 1; panel.add(lblContactName, gbc);
        gbc.gridx = 1; panel.add(tfContactName, gbc);
        gbc.gridx = 0; gbc.gridy = 2; panel.add(lblContactNumber, gbc);
        gbc.gridx = 1; panel.add(tfContactNumber, gbc);
        gbc.gridx = 0; gbc.gridy = 3; panel.add(lblEmail, gbc);
        gbc.gridx = 1; panel.add(tfEmail, gbc);
        gbc.gridx = 0; gbc.gridy = 4; panel.add(lblAddress, gbc);
        gbc.gridx = 1; panel.add(tfAddress, gbc);

        JPanel btns = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        btns.setBackground(UIConstants.PANEL_BG);
        JButton ok = new JButton("Save");
        JButton cancel = new JButton("Cancel");
        ok.addActionListener(e -> onSave());
        cancel.addActionListener(e -> onCancel());
        btns.add(ok); btns.add(cancel);

        getContentPane().add(panel, BorderLayout.CENTER);
        getContentPane().add(btns, BorderLayout.SOUTH);
        getRootPane().setDefaultButton(ok);
    }

    private void loadSupplierData() {
        tfName.setText(supplier.getSupplierName());
        tfContactName.setText(supplier.getContactName());
        tfContactNumber.setText(supplier.getContactNumber());
        tfEmail.setText(supplier.getEmail());
        tfAddress.setText(supplier.getAddress());
    }

    private void onSave() {
        if (tfName.getText().trim().isEmpty()) {
            JOptionPane.showMessageDialog(this, "Name is required.", "Validation", JOptionPane.WARNING_MESSAGE);
            return;
        }
        Supplier s = (supplier == null) ? new Supplier() : supplier;
        s.setSupplierName(tfName.getText().trim());
        s.setContactName(tfContactName.getText().trim());
        s.setContactNumber(tfContactNumber.getText().trim());
        s.setEmail(tfEmail.getText().trim());
        s.setAddress(tfAddress.getText().trim());
        boolean ok = (supplier == null)
            ? SupplierDAO.insertSupplier(s)
            : SupplierDAO.updateSupplier(s);
        if (ok) {
            // --- Audit log for add/edit supplier ---
            hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
            int sellerId = user != null ? user.getSellerId() : 1;
            String sellerName = user != null ? user.getSellerName() : "Unknown";
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            String details = (supplier == null ? "Added" : "Edited") + " supplier: " + s.getSupplierName() + " by " + sellerName;
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, sellerId, now, true, "SupplierDialog", supplier == null ? "Add Supplier" : "Edit Supplier", details));
            succeeded = true;
            dispose();
        } else {
            JOptionPane.showMessageDialog(this, "Save failed.", "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void onCancel() {
        succeeded = false;
        dispose();
    }

    public boolean isSucceeded() {
        return succeeded;
    }
}
