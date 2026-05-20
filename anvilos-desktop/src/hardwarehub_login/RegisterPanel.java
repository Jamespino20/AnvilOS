package hardwarehub_login;

import hardwarehub_main.dao.UserDAO;
import hardwarehub_main.model.User;
import java.awt.*;
import java.awt.event.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import javax.swing.*;

public class RegisterPanel extends JPanel {
    private JTextField tfSellerName, tfUsername, tfEmail;
    private JPasswordField pfPassword, pfConfirm;
    private JComboBox<String> cbQ1, cbQ2, cbQ3;
    private JTextField tfA1, tfA2, tfA3;
    private JButton btnRegister, btnBack;
    private LoginFrame parentFrame;

    private static final String[] QUESTIONS = {
        "What is your mother's maiden name?",
        "What was your first pet's name?",
        "What is your favorite color?",
        "What is your birthplace?",
        "What is your favorite food?"
    };

    public RegisterPanel(LoginFrame frame) {
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
        JLabel lblSeller = new JLabel("Seller Name:");
        lblSeller.setFont(arial18);
        lblSeller.setForeground(white);
        glassPanel.add(lblSeller, g);
        g.gridy++;
        tfSellerName = new JTextField(18);
        tfSellerName.setFont(arial18);
        glassPanel.add(tfSellerName, g);
        g.gridy++;
        JLabel lblUser = new JLabel("Username:");
        lblUser.setFont(arial18);
        lblUser.setForeground(white);
        glassPanel.add(lblUser, g);
        g.gridy++;
        tfUsername = new JTextField(18);
        tfUsername.setFont(arial18);
        glassPanel.add(tfUsername, g);
        g.gridy++;
        JLabel lblEmail = new JLabel("Email:");
        lblEmail.setFont(arial18);
        lblEmail.setForeground(white);
        glassPanel.add(lblEmail, g);
        g.gridy++;
        tfEmail = new JTextField(18);
        tfEmail.setFont(arial18);
        glassPanel.add(tfEmail, g);
        g.gridy++;
        JLabel lblPass = new JLabel("Password:");
        lblPass.setFont(arial18);
        lblPass.setForeground(white);
        glassPanel.add(lblPass, g);
        g.gridy++;
        pfPassword = new JPasswordField(18);
        pfPassword.setFont(arial18);
        glassPanel.add(pfPassword, g);
        g.gridy++;
        JLabel lblConf = new JLabel("Confirm Password:");
        lblConf.setFont(arial18);
        lblConf.setForeground(white);
        glassPanel.add(lblConf, g);
        g.gridy++;
        pfConfirm = new JPasswordField(18);
        pfConfirm.setFont(arial18);
        glassPanel.add(pfConfirm, g);

        // Right column
        g.gridx = 1;
        g.gridy = 0;
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
        g.gridy++;
        btnRegister = new JButton("Register");
        btnRegister.setFont(arial18b);
        glassPanel.add(btnRegister, g);
        g.gridy++;
        btnBack = new JButton("Back");
        btnBack.setFont(arial18);
        glassPanel.add(btnBack, g);

        add(glassPanel, gbc);

        btnRegister.addActionListener(e -> attemptRegister());
        btnBack.addActionListener(e -> parentFrame.showPanel(LoginFrame.LOGIN));

        // Key bindings
        InputMap im = getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        ActionMap am = getActionMap();
        im.put(KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0), "register");
        am.put("register", new AbstractAction() { public void actionPerformed(ActionEvent e) { attemptRegister(); }});
        im.put(KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, KeyEvent.ALT_DOWN_MASK), "back");
        am.put("back", new AbstractAction() { public void actionPerformed(ActionEvent e) { parentFrame.showPanel(LoginFrame.LOGIN); }});

        // --- Prevent duplicate questions logic ---
        cbQ1.addActionListener(e -> updateQuestionDropdowns());
        cbQ2.addActionListener(e -> updateQuestionDropdowns());
        cbQ3.addActionListener(e -> updateQuestionDropdowns());
    }

    private void attemptRegister() {
        String seller = tfSellerName.getText().trim();
        String username = tfUsername.getText().trim();
        String email = tfEmail.getText().trim();
        String pw = new String(pfPassword.getPassword());
        String pw2 = new String(pfConfirm.getPassword());
        String q1 = (String) cbQ1.getSelectedItem();
        String q2 = (String) cbQ2.getSelectedItem();
        String q3 = (String) cbQ3.getSelectedItem();
        String a1 = tfA1.getText().trim();
        String a2 = tfA2.getText().trim();
        String a3 = tfA3.getText().trim();
        // Validation
        if (seller.isEmpty() || username.isEmpty() || email.isEmpty() || pw.isEmpty() || pw2.isEmpty() || a1.isEmpty() || a2.isEmpty() || a3.isEmpty()) {
            JOptionPane.showMessageDialog(this, "All fields are required.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: missing fields"));
            return;
        }
        if (!email.matches("^[^@\s]+@[^@\s]+\\.[^@\s]+$")) {
            JOptionPane.showMessageDialog(this, "Invalid email format.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: invalid email format for " + email));
            return;
        }
        if (!pw.equals(pw2)) {
            JOptionPane.showMessageDialog(this, "Passwords do not match.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: passwords do not match for username: " + username));
            return;
        }
        if (username.length() < 2 || username.chars().distinct().count() == 1) {
            JOptionPane.showMessageDialog(this, "Username must be at least 2 characters and not all the same character.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: invalid username: " + username));
            return;
        }
        if (pw.length() < 8) {
            JOptionPane.showMessageDialog(this, "Password must be at least 8 characters.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: password too short for username: " + username));
            return;
        }
        java.util.Set<String> qs = new java.util.HashSet<>();
        qs.add(q1); qs.add(q2); qs.add(q3);
        if (qs.size() < 3) {
            JOptionPane.showMessageDialog(this, "Security questions must be unique.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: duplicate security questions for username: " + username));
            return;
        }
        if (UserDAO.getUserByUsername(username) != null) {
            JOptionPane.showMessageDialog(this, "Username already exists.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: username exists: " + username));
            return;
        }
        for (User u : UserDAO.getAllUsers()) {
            if (u.getEmail().equalsIgnoreCase(email)) {
                JOptionPane.showMessageDialog(this, "Email already exists.", "Error", JOptionPane.ERROR_MESSAGE);
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed: email exists: " + email));
                return;
            }
        }
        // Insert user
        User user = new User();
        user.setSellerName(seller);
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(hashPassword(pw));
        user.setSecurityQuestion1(q1);
        user.setSecurityAnswer1(a1);
        user.setSecurityQuestion2(q2);
        user.setSecurityAnswer2(a2);
        user.setSecurityQuestion3(q3);
        user.setSecurityAnswer3(a3);
        user.setRegistryDate(LocalDate.now());
        user.setLastLogin(java.time.LocalDateTime.now());
        if (UserDAO.insertUser(user)) {
            // Only now user has a valid sellerId, so reload from DB
            User inserted = UserDAO.getUserByUsername(username);
            JOptionPane.showMessageDialog(this, "Registration successful!", "Success", JOptionPane.INFORMATION_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, inserted != null ? inserted.getSellerId() : 0, java.time.LocalDateTime.now(), true, "RegisterPanel", "Register", "Registration successful for user: " + username));
            parentFrame.showPanel(LoginFrame.LOGIN);
        } else {
            JOptionPane.showMessageDialog(this, "Registration failed.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "RegisterPanel", "Register", "Registration failed for user: " + username));
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