package hardwarehub_login;

import hardwarehub_main.dao.UserDAO;
import hardwarehub_main.model.User;
import java.awt.*;
import java.awt.event.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import javax.swing.*;

public class ForgotPasswordPanel extends JPanel {
    private JTextField tfUsername;
    private JComboBox<String> cbQ1, cbQ2, cbQ3;
    private JTextField tfA1, tfA2, tfA3;
    private JPasswordField pfPassword, pfConfirm;
    private JCheckBox cbShowPassword;
    private JButton btnReset, btnBack;
    private LoginFrame parentFrame;
    private boolean qnaVerified = false;

    private static final String[] QUESTIONS = {
        "What is your mother's maiden name?",
        "What was your first pet's name?",
        "What is your favorite color?",
        "What is your birthplace?",
        "What is your favorite food?"
    };

    public ForgotPasswordPanel(LoginFrame frame) {
        this.parentFrame = frame;
        setOpaque(false);
        setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(0, 0, 0, 0);
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.weightx = 1.0;
        gbc.anchor = GridBagConstraints.CENTER;
        gbc.fill = GridBagConstraints.NONE;

        // Logo above the rectangle
        ImageIcon logoIcon = hardwarehub_main.util.IconUtil.loadIcon("HardwareHub_Logo.png");
        int logoWidth = 440;
        int logoHeight = logoIcon.getIconHeight() * logoWidth / logoIcon.getIconWidth();
        Image scaledLogo = logoIcon.getImage().getScaledInstance(logoWidth, logoHeight, Image.SCALE_SMOOTH);
        JLabel logoLabel = new JLabel(new ImageIcon(scaledLogo));
        logoLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        logoLabel.setBorder(BorderFactory.createEmptyBorder(0, 0, 24, 0));
        add(logoLabel, gbc);

        gbc.gridy++;
        // Main container with rounded, semi-transparent background
        JPanel glassPanel = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(new Color(30, 30, 30, 180));
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 40, 40);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        glassPanel.setOpaque(false);
        glassPanel.setLayout(new GridBagLayout());
        glassPanel.setBorder(BorderFactory.createEmptyBorder(32, 48, 32, 48));

        Font arial18 = new Font("Arial", Font.PLAIN, 18);
        Font arial18b = new Font("Arial", Font.BOLD, 18);
        Color white = Color.WHITE;

        GridBagConstraints g = new GridBagConstraints();
        g.insets = new Insets(8, 10, 8, 10);
        g.fill = GridBagConstraints.HORIZONTAL;
        g.gridwidth = 1;
        g.gridy = 0;
        g.gridx = 0;

        // Left column
        JLabel lblUser = new JLabel("Username:");
        lblUser.setFont(arial18);
        lblUser.setForeground(white);
        glassPanel.add(lblUser, g);
        g.gridy++;
        tfUsername = new JTextField(18);
        tfUsername.setFont(arial18);
        glassPanel.add(tfUsername, g);
        g.gridy++;
        JLabel lblQ1 = new JLabel("Security Question 1:");
        lblQ1.setFont(arial18);
        lblQ1.setForeground(white);
        glassPanel.add(lblQ1, g);
        g.gridy++;
        cbQ1 = new JComboBox<>(QUESTIONS);
        cbQ1.setFont(arial18);
        glassPanel.add(cbQ1, g);
        g.gridy++;
        tfA1 = new JTextField(18);
        tfA1.setFont(arial18);
        glassPanel.add(tfA1, g);
        g.gridy++;
        JLabel lblQ2 = new JLabel("Security Question 2:");
        lblQ2.setFont(arial18);
        lblQ2.setForeground(white);
        glassPanel.add(lblQ2, g);
        g.gridy++;
        cbQ2 = new JComboBox<>(QUESTIONS);
        cbQ2.setFont(arial18);
        glassPanel.add(cbQ2, g);
        g.gridy++;
        tfA2 = new JTextField(18);
        tfA2.setFont(arial18);
        glassPanel.add(tfA2, g);
        g.gridy++;
        JLabel lblQ3 = new JLabel("Security Question 3:");
        lblQ3.setFont(arial18);
        lblQ3.setForeground(white);
        glassPanel.add(lblQ3, g);
        g.gridy++;
        cbQ3 = new JComboBox<>(QUESTIONS);
        cbQ3.setFont(arial18);
        glassPanel.add(cbQ3, g);
        g.gridy++;
        tfA3 = new JTextField(18);
        tfA3.setFont(arial18);
        glassPanel.add(tfA3, g);

        // Right column
        g.gridx = 1;
        g.gridy = 0;
        JLabel lblNewPass = new JLabel("New Password:");
        lblNewPass.setFont(arial18);
        lblNewPass.setForeground(white);
        glassPanel.add(lblNewPass, g);
        g.gridy++;
        pfPassword = new JPasswordField(18);
        pfPassword.setFont(arial18);
        pfPassword.setEnabled(false);
        pfPassword.setBackground(Color.LIGHT_GRAY);
        glassPanel.add(pfPassword, g);
        g.gridy++;
        JLabel lblConf = new JLabel("Confirm Password:");
        lblConf.setFont(arial18);
        lblConf.setForeground(white);
        glassPanel.add(lblConf, g);
        g.gridy++;
        pfConfirm = new JPasswordField(18);
        pfConfirm.setFont(arial18);
        pfConfirm.setEnabled(false);
        pfConfirm.setBackground(Color.LIGHT_GRAY);
        glassPanel.add(pfConfirm, g);
        g.gridy++;
        cbShowPassword = new JCheckBox("Show Password");
        cbShowPassword.setFont(arial18);
        cbShowPassword.setEnabled(false);
        glassPanel.add(cbShowPassword, g);
        g.gridy++;
        btnReset = new JButton("Reset Password");
        btnReset.setFont(arial18b);
        glassPanel.add(btnReset, g);
        g.gridy++;
        btnBack = new JButton("Back");
        btnBack.setFont(arial18);
        glassPanel.add(btnBack, g);

        add(glassPanel, gbc);

        btnReset.addActionListener(e -> attemptReset());
        btnBack.addActionListener(e -> parentFrame.showPanel(LoginFrame.LOGIN));
        cbShowPassword.addActionListener(e -> {
            char ch = cbShowPassword.isSelected() ? (char)0 : '\u2022';
            pfPassword.setEchoChar(ch);
            pfConfirm.setEchoChar(ch);
        });
        pfPassword.setEchoChar('\u2022');
        pfConfirm.setEchoChar('\u2022');

        // Key bindings
        InputMap im = getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        ActionMap am = getActionMap();
        im.put(KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0), "reset");
        am.put("reset", new AbstractAction() { public void actionPerformed(ActionEvent e) { attemptReset(); }});
        im.put(KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, KeyEvent.ALT_DOWN_MASK), "back");
        am.put("back", new AbstractAction() { public void actionPerformed(ActionEvent e) { parentFrame.showPanel(LoginFrame.LOGIN); }});

        // --- Prevent duplicate questions logic ---
        cbQ1.addActionListener(e -> updateQuestionDropdowns());
        cbQ2.addActionListener(e -> updateQuestionDropdowns());
        cbQ3.addActionListener(e -> updateQuestionDropdowns());
    }

    private void attemptReset() {
        String username = tfUsername.getText().trim();
        String q1 = (String) cbQ1.getSelectedItem();
        String q2 = (String) cbQ2.getSelectedItem();
        String q3 = (String) cbQ3.getSelectedItem();
        String a1 = tfA1.getText().trim();
        String a2 = tfA2.getText().trim();
        String a3 = tfA3.getText().trim();
        if (!qnaVerified) {
            User user = UserDAO.getUserByUsername(username);
            if (user == null) {
                JOptionPane.showMessageDialog(this, "User not found.", "Error", JOptionPane.ERROR_MESSAGE);
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "ForgotPasswordPanel", "Password Reset", "Password reset failed: user not found for username: " + username));
                return;
            }
            boolean match =
                q1.equals(user.getSecurityQuestion1()) && a1.equals(user.getSecurityAnswer1()) &&
                q2.equals(user.getSecurityQuestion2()) && a2.equals(user.getSecurityAnswer2()) &&
                q3.equals(user.getSecurityQuestion3()) && a3.equals(user.getSecurityAnswer3());
            if (!match) {
                JOptionPane.showMessageDialog(this, "Security answers do not match.", "Error", JOptionPane.ERROR_MESSAGE);
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, user.getSellerId(), java.time.LocalDateTime.now(), false, "ForgotPasswordPanel", "Password Reset", "Password reset failed: security answers do not match for username: " + username));
                return;
            }
            qnaVerified = true;
            pfPassword.setEnabled(true);
            pfPassword.setBackground(Color.WHITE);
            pfConfirm.setEnabled(true);
            pfConfirm.setBackground(Color.WHITE);
            cbShowPassword.setEnabled(true);
            JOptionPane.showMessageDialog(this, "Security answers verified. You may now reset your password.");
            return;
        }
        String pw = new String(pfPassword.getPassword());
        String pw2 = new String(pfConfirm.getPassword());
        if (pw.isEmpty() || pw2.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please enter and confirm your new password.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "ForgotPasswordPanel", "Password Reset", "Password reset failed: missing new password for username: " + username));
            return;
        }
        if (!pw.equals(pw2)) {
            JOptionPane.showMessageDialog(this, "Passwords do not match.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "ForgotPasswordPanel", "Password Reset", "Password reset failed: passwords do not match for username: " + username));
            return;
        }
        User user = UserDAO.getUserByUsername(username);
        if (user == null) {
            JOptionPane.showMessageDialog(this, "User not found.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "ForgotPasswordPanel", "Password Reset", "Password reset failed: user not found for username: " + username));
            return;
        }
        user.setPasswordHash(hashPassword(pw));
        if (UserDAO.updateUser(user)) {
            JOptionPane.showMessageDialog(this, "Password reset successful!", "Success", JOptionPane.INFORMATION_MESSAGE);
            User updated = UserDAO.getUserByUsername(username);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, updated != null ? updated.getSellerId() : 0, java.time.LocalDateTime.now(), true, "ForgotPasswordPanel", "Password Reset", "Password reset successful for user: " + username));
            parentFrame.showPanel(LoginFrame.LOGIN);
        } else {
            JOptionPane.showMessageDialog(this, "Password reset failed.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, user.getSellerId(), java.time.LocalDateTime.now(), false, "ForgotPasswordPanel", "Password Reset", "Password reset failed for user: " + username));
        }
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    private void updateQuestionDropdowns() {
        String sel1 = (String) cbQ1.getSelectedItem();
        String sel2 = (String) cbQ2.getSelectedItem();
        String sel3 = (String) cbQ3.getSelectedItem();
        // Update Q2
        cbQ2.setModel(new DefaultComboBoxModel<>(getAvailableQuestions(sel1, sel3)));
        cbQ2.setSelectedItem(sel2);
        // Update Q3
        cbQ3.setModel(new DefaultComboBoxModel<>(getAvailableQuestions(sel1, sel2)));
        cbQ3.setSelectedItem(sel3);
    }

    private String[] getAvailableQuestions(String... exclude) {
        java.util.List<String> list = new java.util.ArrayList<>();
        outer: for (String q : QUESTIONS) {
            for (String ex : exclude) if (q.equals(ex)) continue outer;
            list.add(q);
        }
        return list.toArray(new String[0]);
    }
} 