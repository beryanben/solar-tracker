# Design System: Solar Tracker AR
**Project ID:** 5180756749534933417

## 1. Visual Theme & Atmosphere
The atmosphere is "Cinematic HUD". Black background, pure "LIMANDAT" branding, and a single vibrant orange accent. Focus on extreme minimalism and vertical spacing.

## 2. Color Palette & Roles
- **Vibrant Orange** (#FF6600) – Current sun position orb, active month dot, and "POSITION ACTUAL" arrow.
- **Deep Black** (#000000) – Background.
- **Muted Silver** (#888888) – Secondary text (Position Actual, Month names non-active).
- **Pure Stark White** (#FFFFFF) – Active month text.

## 3. Typography Rules
- **Technical Monospace** (System or JetBrains Mono) for "POSITION ACTUAL" and months.
- Large tracking (letter-spacing) for "L I M A N D A T" branding.
- Font size: ~10-12px for technical text, ~14px for branding.

## 4. Component Stylings
* **Sun Orb:** Small solid orange point (#FF6600) with a larger concentric orange circle at 20% opacity.
* **Sun Arc:** Perfectly thin, 1px solid gray/white line with a gentle fade at the ends.
* **Month Selector:** Floating glass-pilled container. Dark background, semi-transparent. Selected month has a white color and a small orange dot below it.
* **Branding:** "L I M A N D A T" centered above the date selector.

## 5. Layout Principles
- **Top Left:** "POSITION ACTUAL" with an orange arrow icon.
- **Center:** Sun arc and orb.
- **Bottom:** Centered branding and month selector.

## 6. Design System Notes for Stitch Generation
**DESIGN SYSTEM (REQUIRED):**
- Platform: Mobile AR, Camera-first
- Theme: Ultra-Minimalist Dark (Cinematic HUD)
- Background: Black (#000000)
- Primary Accent: Vibrant Orange (#FF6600)
- Text Primary: White (#FFFFFF) for active, Silver (#888888) for inactive
- Font: Monospace technical font
- Layout: Balanced vertical stack (Top label, Center visual, Bottom controls)
