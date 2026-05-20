package hardwarehub_login;

import hardwarehub_main.model.User;
import java.awt.*;
import java.awt.event.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import javax.swing.*;

public class LoginPanel extends JPanel {

    private JTextField tfUsername;
    private JPasswordField pfPassword;
    private JCheckBox cbShowPassword;
    private JButton btnLogin;
    private JLabel lblRegister;
    private JLabel lblForgot;
    private LoginFrame parentFrame;

    public LoginPanel(LoginFrame frame) {
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
        glassPanel.setLayout(new BoxLayout(glassPanel, BoxLayout.Y_AXIS));
        glassPanel.setBorder(BorderFactory.createEmptyBorder(32, 48, 32, 48));

        Font arial18 = new Font("Arial", Font.PLAIN, 18);
        Font arial18b = new Font("Arial", Font.BOLD, 18);
        Color white = Color.WHITE;

        // Username label and field
        JPanel userPanel = new JPanel();
        userPanel.setOpaque(false);
        userPanel.setLayout(new BoxLayout(userPanel, BoxLayout.X_AXIS));
        JLabel lblUser = new JLabel("Username:");
        lblUser.setFont(arial18);
        lblUser.setForeground(white);
        lblUser.setPreferredSize(new Dimension(120, 36));
        tfUsername = new JTextField(18);
        tfUsername.setMaximumSize(new Dimension(Integer.MAX_VALUE, 36));
        tfUsername.setFont(arial18);
        userPanel.add(lblUser);
        userPanel.add(Box.createHorizontalStrut(8));
        userPanel.add(tfUsername);
        glassPanel.add(userPanel);
        glassPanel.add(Box.createVerticalStrut(12));

        // Password label and field
        JPanel passPanel = new JPanel();
        passPanel.setOpaque(false);
        passPanel.setLayout(new BoxLayout(passPanel, BoxLayout.X_AXIS));
        JLabel lblPass = new JLabel("Password:");
        lblPass.setFont(arial18);
        lblPass.setForeground(white);
        lblPass.setPreferredSize(new Dimension(120, 36));
        pfPassword = new JPasswordField(18);
        pfPassword.setMaximumSize(new Dimension(Integer.MAX_VALUE, 36));
        pfPassword.setFont(arial18);
        passPanel.add(lblPass);
        passPanel.add(Box.createHorizontalStrut(8));
        passPanel.add(pfPassword);
        glassPanel.add(passPanel);
        glassPanel.add(Box.createVerticalStrut(8));

        // Show password right-aligned
        JPanel showPanel = new JPanel();
        showPanel.setOpaque(false);
        showPanel.setLayout(new BoxLayout(showPanel, BoxLayout.X_AXIS));
        showPanel.add(Box.createHorizontalGlue());
        cbShowPassword = new JCheckBox("Show Password");
        cbShowPassword.setOpaque(false);
        cbShowPassword.setForeground(white);
        cbShowPassword.setFont(arial18);
        showPanel.add(cbShowPassword);
        glassPanel.add(showPanel);
        glassPanel.add(Box.createVerticalStrut(16));

        // Login button
        btnLogin = new JButton("Enter");
        btnLogin.setFont(arial18b);
        btnLogin.setAlignmentX(Component.CENTER_ALIGNMENT);
        glassPanel.add(btnLogin);
        glassPanel.add(Box.createVerticalStrut(16));

        // Hyperlinks on one line
        JPanel linkPanel = new JPanel();
        linkPanel.setOpaque(false);
        linkPanel.setLayout(new BoxLayout(linkPanel, BoxLayout.X_AXIS));
        lblForgot = new JLabel("<html><a href='#' style='color:white'>Forgot Password?</a></html>");
        lblForgot.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        lblForgot.setFont(arial18);
        lblRegister = new JLabel("<html><a href='#' style='color:white'>No account? Register</a></html>");
        lblRegister.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        lblRegister.setFont(arial18);
        linkPanel.add(lblForgot);
        linkPanel.add(Box.createHorizontalStrut(16));
        linkPanel.add(lblRegister);
        linkPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
        glassPanel.add(linkPanel);

        add(glassPanel, gbc);

        // Show/hide password
        cbShowPassword.addActionListener(e -> pfPassword.setEchoChar(cbShowPassword.isSelected() ? (char) 0 : '\u2022'));
        pfPassword.setEchoChar('\u2022');

        // Login action
        btnLogin.addActionListener(e -> attemptLogin());
        tfUsername.addActionListener(e -> attemptLogin());
        pfPassword.addActionListener(e -> attemptLogin());

        // Register hyperlink
        lblRegister.addMouseListener(new MouseAdapter() {
            public void mouseClicked(MouseEvent e) {
                parentFrame.showPanel(LoginFrame.REGISTER);
            }
        });
        // Forgot hyperlink
        lblForgot.addMouseListener(new MouseAdapter() {
            public void mouseClicked(MouseEvent e) {
                parentFrame.showPanel(LoginFrame.FORGOT);
            }
        });

        // Key bindings
        InputMap im = getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        ActionMap am = getActionMap();
        im.put(KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0), "login");
        am.put("login", new AbstractAction() {
            public void actionPerformed(ActionEvent e) {
                attemptLogin();
            }
        });
        im.put(KeyStroke.getKeyStroke(KeyEvent.VK_LEFT, KeyEvent.ALT_DOWN_MASK), "back");
        am.put("back", new AbstractAction() {
            public void actionPerformed(ActionEvent e) {
                System.exit(0);
            }
        });
    }

    private void attemptLogin() {
        String username = tfUsername.getText().trim();
        String password = new String(pfPassword.getPassword());
        if (username.isEmpty() || password.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please enter both username and password.", "Error", JOptionPane.ERROR_MESSAGE);
            // Audit log for empty fields
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "LoginPanel", "Login", "Login failed: empty fields for username/password"));
            return;
        }

        // Check user existence and password before showing loader
        User user = hardwarehub_main.dao.UserDAO.getUserByUsername(username);
        if (user == null) {
            JOptionPane.showMessageDialog(this, "User not found.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, 0, java.time.LocalDateTime.now(), false, "LoginPanel", "Login", "Login failed: user not found for username: " + username));
            return;
        }
        String hash = hashPassword(password);
        if (!hash.equals(user.getPasswordHash())) {
            JOptionPane.showMessageDialog(this, "Incorrect password.", "Error", JOptionPane.ERROR_MESSAGE);
            hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, user.getSellerId(), java.time.LocalDateTime.now(), false, "LoginPanel", "Login", "Login failed: incorrect password for username: " + username));
            return;
        }

        // Dispose login frame first
        JFrame topFrame = (JFrame) SwingUtilities.getWindowAncestor(this);
        topFrame.dispose();

        LoaderDialog loader = new LoaderDialog(null); // No parent, centers on screen
        final User[] resultHolder = new User[1];
        SwingWorker<Void, Void> worker = new SwingWorker<>() {
            @Override
            protected Void doInBackground() {
                try { Thread.sleep(1100); } catch (InterruptedException ignored) {}
                loader.showRandomText();
                try { Thread.sleep(1100); } catch (InterruptedException ignored) {}
                loader.showRandomText();
                // Set IS_ACTIVE=1 for this user
                hardwarehub_main.dao.UserDAO.updateUserActiveStatus(user.getSellerId(), 1);
                // Update LAST_LOGIN to now
                user.setLastLogin(java.time.LocalDateTime.now());
                hardwarehub_main.dao.UserDAO.updateUser(user);
                resultHolder[0] = user;
                // Audit log for successful login
                hardwarehub_main.dao.AuditLogDAO.insertAuditLog(new hardwarehub_main.model.AuditLog(0, user.getSellerId(), java.time.LocalDateTime.now(), true, "LoginPanel", "Login", "Login successful for user: " + username));
                return null;
            }
            @Override
            protected void done() {
                loader.dispose();
                try {
                    User user = resultHolder[0];
                    hardwarehub_main.model.User.setCurrentUser(user);
                    // Set Substance LAF
                    try {
                        org.pushingpixels.substance.api.SubstanceCortex.GlobalScope.setSkin(new org.pushingpixels.substance.api.skin.BusinessBlueSteelSkin());
                    } catch (Exception ignore) {}
                    hardwarehub_main.gui.dashboard.DashboardPanel.main(new String[0]);
                } catch (Exception ex) {
                    JOptionPane.showMessageDialog(null, "An error occurred during login.", "Error", JOptionPane.ERROR_MESSAGE);
                }
            }
        };
        worker.execute();
        loader.setVisible(true); // Modal, so GIF animates while worker runs
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
