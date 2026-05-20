package hardwarehub_main.util;

import java.io.File;
import java.net.URISyntaxException;

public class SystemPathUtil {
    /**
     * Returns the directory where the currently running JAR or class is located.
     * Works cross-platform (Windows, Mac, Linux).
     */
    public static String getExecutableDirectory() {
        try {
            String path = SystemPathUtil.class.getProtectionDomain().getCodeSource().getLocation().toURI().getPath();
            File file = new File(path);
            if (file.isFile()) {
                // If running from a JAR
                return file.getParent();
            } else {
                // If running from classes directory
                return file.getPath();
            }
        } catch (URISyntaxException e) {
            return System.getProperty("user.dir");
        }
    }
} 