---
name: AnvilOS
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#43474b'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#73777c'
  outline-variant: '#c3c7cb'
  surface-tint: '#4e616e'
  primary: '#0e212c'
  on-primary: '#ffffff'
  primary-container: '#243642'
  on-primary-container: '#8c9fad'
  inverse-primary: '#b6c9d8'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#112030'
  on-tertiary: '#ffffff'
  tertiary-container: '#263546'
  on-tertiary-container: '#8f9db2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e5f5'
  primary-fixed-dim: '#b6c9d8'
  on-primary-fixed: '#0a1d29'
  on-primary-fixed-variant: '#374956'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#d4e4fa'
  tertiary-fixed-dim: '#b9c8de'
  on-tertiary-fixed: '#0d1c2d'
  on-tertiary-fixed-variant: '#39485a'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  sidebar-width: 260px
  container-padding: 24px
  table-cell-padding: 12px 16px
  stack-gap: 16px
  grid-gutter: 20px
---

## Brand & Style
The design system is engineered for the high-intensity environment of hardware retail and warehouse management. It balances industrial ruggedness with professional software precision. The aesthetic is "Clean Industrial"—utilizing a palette of heavy metals and slate, punctuated by high-visibility safety accents. 

The primary goal is to evoke a sense of reliability and durability. The UI should feel like a high-end precision tool: efficient, no-nonsense, and structurally sound. We leverage a **Corporate / Modern** style with subtle **Brutalist** undertones—specifically through the use of strong borders and a highly structured grid—to ensure the interface remains grounded and legible amidst dense data sets.

## Colors
The palette is rooted in the materials of the trade.
- **Primary (Industrial Blue):** A deep, saturated slate blue used for primary navigation and structural headers. It provides a stable, professional foundation.
- **Secondary (Safety Orange):** Reserved strictly for high-priority actions, critical stock alerts, and primary "Complete Transaction" buttons. It mirrors the high-visibility markers found in industrial workspaces.
- **Tertiary (Steel Silver):** Used for subtle dividers, inactive states, and decorative accents that reinforce the hardware theme.
- **Neutral (Slate Grays):** A comprehensive range of grays from off-white surfaces to charcoal text, ensuring hierarchical clarity without the harshness of pure black.

**Functional Accents:**
- **Success:** Forest Green (Hardware green) for "In Stock" or "Paid" statuses.
- **Warning:** Caution Yellow for low-stock alerts.

## Typography
We utilize **Inter** for its exceptional legibility in dense data environments. Its neutral, systematic character allows users to scan SKU numbers and inventory lists without fatigue. For technical data, barcodes, and serial numbers, we introduce **JetBrains Mono** to provide clear character differentiation (e.g., distinguishing '0' from 'O').

**Scale Usage:**
- **Display/Headline:** Used for total amounts in the POS and warehouse section headers.
- **Body-md:** The workhorse for all table data and inventory descriptions.
- **Label-mono:** Specifically for SKUs, part numbers, and quantities.
- **Label-sm:** Used for table headers and category tags to maximize vertical space.

## Layout & Spacing
This design system employs a **Fixed Sidebar / Fluid Content** model optimized for wide-screen POS terminals and desktop monitors.

- **Grid:** A 12-column grid system is used within the fluid content area.
- **Density:** We prioritize a "Compact" spacing rhythm. Standard increments are based on 4px units, but core layout gaps are set to 20px to maintain a clean, organized appearance despite the information density.
- **Sidebar:** A persistent left-hand navigation allows for rapid switching between Sales, Inventory, Customers, and Reporting. 
- **The "Split" POS View:** The sales interface uses a 2/3 (Product Selection) and 1/3 (Transaction Summary) layout to keep the checkout process focused.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows, reflecting the "flat" and "rugged" industrial aesthetic.

1.  **Background (Level 0):** A light slate gray (`#F1F5F9`) representing the "floor" of the application.
2.  **Surface (Level 1):** White cards or panels for primary content and tables, featuring a 1px steel border (`#CBD5E1`).
3.  **Active Overlay (Level 2):** Subtle, tight shadows (4px blur, 10% opacity) are used only for dropdowns and modal dialogs to indicate they are temporary layers.
4.  **Inset States:** Used for search bars and input fields to give them a "machined" look, suggesting they are carved into the surface.

## Shapes
We use a **Soft (0.25rem)** roundedness level. This subtle rounding prevents the UI from feeling overly aggressive or dated while maintaining a "tooled" and "mechanical" precision. 

- **Components:** Buttons, inputs, and tags all share the `rounded-sm` (4px) radius.
- **Containers:** Main content panels and the sidebar use `rounded-md` (8px) to create a clear structural distinction.
- **Indicators:** Circular indicators are permitted only for status lights (e.g., Online/Offline or Stock Status) to mimic physical LEDs.

## Components
- **Buttons:** 
  - *Primary:* Safety Orange background with white text. High contrast for "Pay" or "Confirm."
  - *Secondary:* Steel Silver borders with Industrial Blue text. 
  - *Ghost:* Used for secondary navigation within panels.
- **Data Tables:** High-density rows with alternating "Zebra" striping in light slate. Headers are "Sticky" and use the `label-sm` typographic style.
- **Status Chips:** Rectangular tags with low-saturation backgrounds and high-saturation text. Use "Success Green" for 'Available' and "Error Red" for 'Out of Stock.'
- **Input Fields:** Heavy 1px borders in Slate-300. On focus, the border shifts to Industrial Blue with a subtle 2px outer glow.
- **Inventory Cards:** Used in the "Product Picker" view, featuring a small thumbnail, a clear bold price in the top right, and the SKU in `label-mono` at the bottom.
- **Sidebar Nav:** Solid Industrial Blue background. Active states are indicated by a Safety Orange vertical bar on the left edge of the menu item.