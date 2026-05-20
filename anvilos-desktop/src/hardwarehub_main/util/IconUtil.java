package hardwarehub_main.util;

import java.awt.image.BufferedImage;
import java.net.URL;
import javax.swing.*;

public class IconUtil {
    /**
     * Loads an icon from the resources folder using getResource().
     * @param filename e.g. "inventory/AddProductButton.png"
     * @return the ImageIcon, or a blank icon if not found
     */
    public static ImageIcon loadIcon(String filename) {
        // Try loading from the executable directory first
        String exeDir = hardwarehub_main.util.SystemPathUtil.getExecutableDirectory();
        java.io.File file = new java.io.File(exeDir, filename);
        if (file.exists()) {
            return new ImageIcon(file.getAbsolutePath());
        }
        // Fallback: load from resources on the classpath
        URL url = IconUtil.class.getClassLoader()
                .getResource("hardwarehub_resources/pictures/" + filename);
        System.out.println("Loading icon: " + filename + " URL: " + url);
        if (url != null) {
            return new ImageIcon(url);
        }
        // fallback: empty icon of size 32×32
        return new ImageIcon(new BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB));
    }

    /**
     * Converts a generic Image to a BufferedImage.
     */
    public static java.awt.image.BufferedImage toBufferedImage(java.awt.Image img) {
        if (img instanceof java.awt.image.BufferedImage) {
            return (java.awt.image.BufferedImage) img;
        }
        java.awt.image.BufferedImage bimage = new java.awt.image.BufferedImage(
                img.getWidth(null), img.getHeight(null), java.awt.image.BufferedImage.TYPE_INT_ARGB);
        java.awt.Graphics2D bGr = bimage.createGraphics();
        bGr.drawImage(img, 0, 0, null);
        bGr.dispose();
        return bimage;
    }
}
