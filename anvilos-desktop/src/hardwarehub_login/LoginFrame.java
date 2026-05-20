package hardwarehub_login;

import hardwarehub_main.util.IconUtil;
import org.pushingpixels.substance.api.SubstanceCortex;
import org.pushingpixels.substance.api.skin.BusinessBlueSteelSkin;
import hardwarehub_main.gui.dashboard.DashboardPanel;
import javax.swing.*;
import java.awt.*;

public class LoginFrame extends JFrame {
    private CardLayout cardLayout;
    private JPanel cardHolder;

    public static final String LOGIN = "login";
    public static final String REGISTER = "register";
    public static final String FORGOT = "forgot";

    public LoginFrame() {
        super("HardwareHub Login");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setSize(1510, 1080);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());
        ImageIcon icon = IconUtil.loadIcon("HardwareHub_Icon.png");
        setIconImage(icon.getImage());
        setResizable(false);
        
        // Set background image using a custom JPanel
        setContentPane(new BackgroundPanel());
        getContentPane().setLayout(new GridBagLayout());

        cardHolder = new JPanel();
        cardHolder.setOpaque(false);
        cardHolder.setLayout(new CardLayout());
        cardHolder.add(new LoginPanel(this), LOGIN);
        cardHolder.add(new RegisterPanel(this), REGISTER);
        cardHolder.add(new ForgotPasswordPanel(this), FORGOT);

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.weightx = 1.0;
        gbc.weighty = 1.0;
        gbc.anchor = GridBagConstraints.CENTER;
        gbc.fill = GridBagConstraints.NONE;
        getContentPane().add(cardHolder, gbc);
    }

    public void showPanel(String name) {
        CardLayout cl = (CardLayout) cardHolder.getLayout();
        cl.show(cardHolder, name);
    }

    // Custom JPanel for background image
    private static class BackgroundPanel extends JPanel {
        private final Image bgImage;
        public BackgroundPanel() {
            ImageIcon bgIcon = IconUtil.loadIcon("CWLHardware_Location.png");
            bgImage = bgIcon.getImage();
            setOpaque(false);
        }
        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            if (bgImage != null) {
                g.drawImage(bgImage, 0, 0, getWidth(), getHeight(), this);
            }
        }
    }
    
        public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            LoginFrame loginFrame = new LoginFrame();
            loginFrame.setVisible(true);
        });
    }
} 