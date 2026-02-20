# Project Vision & Constitution: Solar Tracker AR

> **AGENT INSTRUCTION:** Read this file before every iteration. It serves as the project's "Long-Term Memory."

## 1. Core Identity
* **Project Name:** Solar Tracker AR
* **Stitch Project ID:** 5180756749534933417
* **Mission:** Provide an immersive, ultra-minimalist augmented reality experience for sun tracking across seasons.
* **Target Audience:** Tech-savvy photographers, architects, and solar enthusiasts.
* **Voice:** Technical, precise, minimalist, and premium.

## 2. Visual Language
*Reference these descriptors when prompting Stitch.*

* **The "Vibe" (Adjectives):**
    * *Primary:* Ultra-Minimalist
    * *Secondary:* Camera-First
    * *Tertiary:* Futuristic / HUD

## 3. Architecture & File Structure
* **Root:** `src/` (Vite-based)
* **Asset Flow:** Stitch generates concepts → Manual implementation in React/Vite.
* **Navigation Strategy:** Single-page immersive view with floating discreet controls.

## 4. Live Sitemap (Current State)
* [x] `App.tsx` - Main AR View with stats and timeline.
* [x] `useSolarTracking.ts` - Core logic for sun positions.
* [x] `AddressBar.tsx` - Discreet location readout.
* [x] `DateScroller.tsx` - Minimalist seasonal timeline.

## 5. The Roadmap (Backlog)
- [ ] Implement detailed "Sun Path" overlay in Three.js.
- [ ] Add "Snapshot" mode to capture AR view with stats.
- [ ] Add "Compass" calibration overlay.

## 6. Creative Freedom Guidelines
1. **Camera-First:** Never block more than 10% of the screen with UI.
2. **Discreet:** Use small font sizes, thin lines, and low-opacity backgrounds.

## 7. Rules of Engagement
1. Maintain the "invisible UI" philosophy.
2. Always update `next-prompt.md` before completing.
