package hardwarehub_main.util;

import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import javax.swing.AbstractAction;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JRootPane;
import javax.swing.KeyStroke;

public class DialogUtils {

    public static void bindEscapeKeyToClose(JDialog dialog) {
        JRootPane rootPane = dialog.getRootPane();
        KeyStroke escapeKeyStroke = KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0);
        String key = "CLOSE_DIALOG";

        rootPane.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(escapeKeyStroke, key);
        rootPane.getActionMap().put(key, new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                dialog.dispose();
            }
        });
    }
}
