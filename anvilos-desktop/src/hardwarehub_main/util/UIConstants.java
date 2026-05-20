package hardwarehub_main.util;

import java.awt.Color;

/**
 * UIConstants holds shared UI-related constants such as color palette
 * and standard dimensions for consistent styling across the application.
 */
public final class UIConstants {
    private UIConstants() {
        // Prevent instantiation
    }

    // Core brand colors
    public static final Color BACKGROUND   = new Color(0x282F3E);
    public static final Color ACCENT       = new Color(0x5EB1BF);
    public static final Color BUTTON_BG    = new Color(0xA2AD59);
    public static final Color PANEL_BG     = new Color(0xDBD3D8);

    // Standard dimensions
    public static final int ICON_SIZE      = 10;
    public static final int CATEGORY_WIDTH = 180;
    public static final int RIBBON_HEIGHT  = 100;
}
