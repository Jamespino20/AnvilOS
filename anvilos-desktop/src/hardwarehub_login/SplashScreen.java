package hardwarehub_login;

import java.awt.*;
import javax.swing.*;

public class SplashScreen extends JWindow {

    public SplashScreen() {
        // Load the image
        java.net.URL imageURL = getClass().getClassLoader().getResource("hardwarehub_resources/pictures/HardwareHub_SplashScreen.png");
        if (imageURL != null) {
            ImageIcon icon = new ImageIcon(imageURL);
            // Scale the image down to max 440x440, preserving aspect ratio
            int maxW = 440, maxH = 440;
            int imgW = icon.getIconWidth();
            int imgH = icon.getIconHeight();
            double scale = Math.min((double)maxW/imgW, (double)maxH/imgH);
            int newW = (int)(imgW * scale);
            int newH = (int)(imgH * scale);
            Image scaledImg = icon.getImage().getScaledInstance(newW, newH, Image.SCALE_SMOOTH);
            ImageIcon scaledIcon = new ImageIcon(scaledImg);
            JLabel splashLabel = new JLabel(scaledIcon);
            splashLabel.setOpaque(false);
            getContentPane().setBackground(new Color(0, 0, 0, 0));
            getContentPane().add(splashLabel, BorderLayout.CENTER);
        } else {
            System.err.println("Error: Image not found!");
            JLabel errorLabel = new JLabel("HardwareHub");
            getContentPane().add(errorLabel, BorderLayout.CENTER);
        }

        pack();
        setLocationRelativeTo(null);
        setBackground(new Color(0, 0, 0, 0));

        // Load and set the application icon
        java.net.URL iconURL = getClass().getClassLoader().getResource("hardwarehub_resources/pictures/HardwareHub_Icon.png");
        if (iconURL != null) {
            ImageIcon icon = new ImageIcon(iconURL);
            setIconImage(icon.getImage());
        } else {
            System.err.println("Error: Icon not found!");
        }

        setVisible(true);

        // Timer to dispose splash screen and open login
        Timer timer = new Timer(3000, e -> {
            ((Timer) e.getSource()).stop();
            dispose();
            SwingUtilities.invokeLater(() -> new LoginFrame().setVisible(true));
        });
        timer.setRepeats(false);
        timer.start();
    }

    public static void main(String[] args) {
        new SplashScreen();
    }
}
